import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from datetime import datetime, timedelta, time
import json
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class CategoryMoodPredictor:
    def __init__(self):
        self.categories = ['activity', 'social', 'health', 'sleep']
        self.days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        # Define emotion categories
        self.negative_emotions = ['bored', 'sad', 'disappointed', 'angry', 'tense']
        self.positive_emotions = ['calm', 'relaxed', 'pleased', 'happy', 'excited']
        self.all_emotions = self.negative_emotions + self.positive_emotions
        
        # Week weights: most recent week = 4, oldest week = 1
        self.week_weights = [1, 2, 3, 4]
    def prepare_category_data(self, mood_logs, category):
        """
        Prepare and analyze data for a specific category using weighted probability
        """
        try:
            # Convert to DataFrame
            df = pd.DataFrame(mood_logs)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp', ascending=False)

            # Filter by category
            category_df = df[df['category'] == category].copy()
            
            if category_df.empty:
                return None, f"No data found for {category} category", None

            # Get current week boundaries
            most_recent = category_df['timestamp'].max()
            current_date = pd.Timestamp.now(tz=most_recent.tz).date()
            current_week_monday = current_date - pd.Timedelta(days=current_date.weekday())
            current_week_start = pd.Timestamp.combine(current_week_monday, time.min).tz_localize(most_recent.tz)

            # Exclude current week data
            category_df = category_df[category_df['timestamp'] < current_week_start]

            # Include data from four weeks before the current week
            four_weeks_ago = current_week_start - pd.Timedelta(days=28)
            category_df = category_df[category_df['timestamp'] >= four_weeks_ago]

            if len(category_df) < 14:  # Need at least 2 weeks of data (14 entries minimum)
                return None, f"Insufficient data for {category} category. Need at least 2 weeks of data.", None

            # Group by weeks (oldest to newest)
            category_df['week_number'] = ((category_df['timestamp'] - four_weeks_ago).dt.days // 7).astype(int)
            category_df = category_df[category_df['week_number'] < 4]  # Only 4 weeks

            # Calculate actual date range used for predictions
            actual_data_start = category_df['timestamp'].min().strftime('%Y-%m-%d')
            actual_data_end = category_df['timestamp'].max().strftime('%Y-%m-%d')
            
            date_range_info = {
                'start_date': actual_data_start,
                'end_date': actual_data_end,
                'total_entries': len(category_df),
                'weeks_of_data': len(category_df['week_number'].unique())
            }

            # Calculate weighted probabilities for each day of the week
            day_predictions = {}
            
            for day in self.days_of_week:
                day_data = category_df[category_df['timestamp'].dt.day_name() == day]
                
                if day_data.empty:
                    day_predictions[day] = {
                        'predicted_mood': 'No data available',
                        'probability': 0.0,
                        'cause': 'No activities recorded'
                    }
                    continue

                # Group mood intensities by mood, week, and specific date for averaging
                mood_daily_intensities = defaultdict(lambda: defaultdict(list))  # {mood: {date_str: [intensities]}}
                activity_mood_mapping = defaultdict(list)
                
                # First pass: collect all intensities per mood per specific date
                for _, row in day_data.iterrows():
                    week_idx = row['week_number']
                    after_emotion = row['afterEmotion'].lower() if row['afterEmotion'] else 'unknown'
                    after_intensity = row.get('afterIntensity', 0)  # Default to 1 if missing
                    date_str = row['timestamp'].strftime('%Y-%m-%d')  # Group by specific date
                    
                    # Skip unknown emotions
                    if after_emotion in self.all_emotions:
                        mood_daily_intensities[after_emotion][date_str].append({
                            'intensity': after_intensity,
                            'week_idx': week_idx
                        })
                        
                        # Track activities/causes for this mood
                        if category == 'sleep':
                            activity_mood_mapping[after_emotion].append(f"{row.get('hrs', 0)} hours of sleep")
                        else:
                            activity_mood_mapping[after_emotion].append(row.get('activity', 'Unknown activity'))

                # Second pass: count occurrences per mood per week and apply week weight
                mood_week_occurrences = defaultdict(lambda: [0.0, 0.0, 0.0, 0.0])  # 4 weeks
                
                for mood, daily_data in mood_daily_intensities.items():
                    for date_str, intensity_records in daily_data.items():
                        week_idx = intensity_records[0]['week_idx']  # All records on same date have same week
                        
                        # Weighted Mean = Σ(wi × xi) / Σ(wi)
                        # wi = week weight, xi = 1 (occurrence indicator)
                        week_weight = self.week_weights[week_idx]
                        mood_week_occurrences[mood][week_idx] += week_weight

                # Calculate total weighted occurrences using weighted mean formula
                mood_total_weighted_occurrences = {}
                total_weighted_occurrence = 0.0
                
                for mood, week_weighted_occurrences in mood_week_occurrences.items():
                    # Sum all weighted occurrences for this mood across all weeks
                    mood_weighted_sum = sum(week_weighted_occurrences)
                    mood_total_weighted_occurrences[mood] = mood_weighted_sum
                    total_weighted_occurrence += mood_weighted_sum

                if total_weighted_occurrence == 0:
                    day_predictions[day] = {
                        'predicted_mood': 'No valid data',
                        'probability': 0.0,
                        'cause': 'No emotions recorded'
                    }
                    continue

                # Calculate probabilities using weighted mean formula
                mood_probabilities = {}
                for mood, weighted_occurrence_sum in mood_total_weighted_occurrences.items():
                    # Weighted Mean = Σ(wi × xi) / Σ(wi)
                    # wi = week weight, xi = 1 (occurrence indicator)
                    probability = weighted_occurrence_sum / total_weighted_occurrence
                    mood_probabilities[mood] = probability

                # Get the mood with highest probability (if tie, select most recent)
                max_probability = max(mood_probabilities.values())
                tied_moods = [mood for mood, prob in mood_probabilities.items() if prob == max_probability]
                
                if len(tied_moods) == 1:
                    predicted_emotion = tied_moods[0]
                else:
                    # In case of tie, select the most recent mood from the data
                    most_recent_mood = None
                    most_recent_timestamp = None
                    
                    for _, row in day_data.iterrows():
                        after_emotion = row['afterEmotion'].lower() if row['afterEmotion'] else 'unknown'
                        if after_emotion in tied_moods:
                            if most_recent_timestamp is None or row['timestamp'] > most_recent_timestamp:
                                most_recent_timestamp = row['timestamp']
                                most_recent_mood = after_emotion
                    
                    predicted_emotion = most_recent_mood if most_recent_mood else tied_moods[0]
                
                predicted_probability = max_probability

                # Get the most common cause for this predicted mood
                causes = activity_mood_mapping.get(predicted_emotion, [])
                if causes:
                    # Get most frequent cause
                    cause_counts = pd.Series(causes).value_counts()
                    most_common_cause = cause_counts.index[0]
                else:
                    most_common_cause = 'Unknown cause'

                # Convert probabilities to percentages with 90% maximum cap
                all_mood_probabilities = {}
                for mood, prob in mood_probabilities.items():
                    # Convert to percentage and cap at 90%
                    percentage = min(prob * 100, 90.0)
                    all_mood_probabilities[mood] = round(percentage, 1)
                
                # Update predicted probability with capped value
                predicted_probability_capped = min(predicted_probability * 100, 90.0)

                day_predictions[day] = {
                    'predicted_mood': predicted_emotion.capitalize(),
                    'probability': round(predicted_probability_capped, 1),
                    'cause': most_common_cause,
                    'all_mood_probabilities': all_mood_probabilities
                }

            return day_predictions, None, date_range_info

        except Exception as e:
            logger.error(f"Error in prepare_category_data for {category}: {str(e)}")
            return None, str(e), None

    def check_category_data_availability(self, mood_logs):
        """
        Check which categories have sufficient data (at least 2 weeks)
        """
        available_categories = {}
        
        for category in self.categories:
            category_data, error, date_range = self.prepare_category_data(mood_logs, category)
            available_categories[category] = {
                'available': category_data is not None,
                'message': error if category_data is None else 'Sufficient data available'
            }
        
        return available_categories

def predict_category_moods(mood_logs, category):
    """
    Predict moods for a specific category using weighted probability
    """
    try:
        predictor = CategoryMoodPredictor()
        predictions, error, date_range_info = predictor.prepare_category_data(mood_logs, category)
        
        if error:
            return {'error': error}
        
        return {'predictions': predictions, 'date_range': date_range_info}
    except Exception as e:
        logger.error(f"Error in predict_category_moods: {str(e)}")
        return {'error': str(e)}

def check_data_availability(mood_logs):
    """
    Check data availability for all categories
    """
    try:
        predictor = CategoryMoodPredictor()
        return predictor.check_category_data_availability(mood_logs)
    except Exception as e:
        logger.error(f"Error in check_data_availability: {str(e)}")
        return {'error': str(e)}
   
@app.route('/api/predict-category-mood', methods=['GET'])
def get_category_prediction():
    try:
        token = request.headers.get('Authorization')
        category = request.args.get('category')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication token is missing or invalid'
            }), 401
            
        if not category or category not in ['activity', 'social', 'health', 'sleep']:
            return jsonify({
                'success': False,
                'message': 'Invalid or missing category parameter'
            }), 400
            
        # Forward the token to Node backend to validate and get mood logs
        import requests
        
        node_api = 'http://localhost:5000'
        response = requests.get(
            f"{node_api}/api/mood-logs-category", 
            headers={
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        )
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': 'Failed to retrieve mood logs from node backend'
            }), response.status_code
            
        mood_logs = response.json().get('logs', [])
        
        # Get predictions for the specific category
        result = predict_category_moods(mood_logs, category)
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'message': result['error']
            }), 400
            
        return jsonify({
            'success': True,
            'category': category,
            'predictions': result['predictions'],
            'date_range': result.get('date_range')
        })
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/check-category-data', methods=['GET'])
def check_category_data():
    try:
        token = request.headers.get('Authorization')
        
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication token is missing or invalid'
            }), 401
            
        # Forward the token to Node backend to validate and get mood logs
        import requests
        
        node_api = 'http://localhost:5000'
        response = requests.get(
            f"{node_api}/api/mood-logs-category", 
            headers={
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        )
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'message': 'Failed to retrieve mood logs from node backend'
            }), response.status_code
            
        mood_logs = response.json().get('logs', [])
        
        # Check data availability for all categories
        availability = check_data_availability(mood_logs)
        
        if 'error' in availability:
            return jsonify({
                'success': False,
                'message': availability['error']
            }), 500
            
        return jsonify({
            'success': True,
            'availability': availability
        })
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/predict-mood', methods=['GET'])
def get_prediction_from_node():
    try:
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({
                'success': False,
                'message': 'Authentication token is missing or invalid'
            }), 401
            
        # This endpoint is deprecated but kept for backward compatibility
        return jsonify({
            'success': False,
            'message': 'This endpoint is deprecated. Use /api/predict-category-mood instead.'
        }), 410
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/predict-category-mood-internal', methods=['POST'])
def predict_category_mood_internal():
    """
    Internal endpoint for admin to get predictions by passing mood logs directly
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
            
        category = data.get('category')
        mood_logs = data.get('mood_logs', [])
        
        if not category or category not in ['activity', 'social', 'health', 'sleep']:
            return jsonify({
                'success': False,
                'message': 'Invalid or missing category parameter'
            }), 400
            
        if not mood_logs:
            return jsonify({
                'success': False,
                'message': 'No mood logs provided'
            }), 400
        
        # Get predictions for the specific category
        result = predict_category_moods(mood_logs, category)
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'message': result['error']
            }), 400
            
        return jsonify({
            'success': True,
            'category': category,
            'predictions': result['predictions'],
            'date_range': result.get('date_range')
        })
        
    except Exception as e:
        logger.error(f"Internal API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)