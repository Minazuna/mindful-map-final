import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from datetime import datetime, timedelta
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
                return None, f"No data found for {category} category"

            # Get current week boundaries
            most_recent = category_df['timestamp'].max()
            current_date = pd.Timestamp.now(tz=most_recent.tz).date()
            current_week_monday = current_date - pd.Timedelta(days=current_date.weekday())
            current_week_start = pd.Timestamp.combine(current_week_monday, datetime.min.time()).tz_localize(most_recent.tz)

            # Exclude current week data
            category_df = category_df[category_df['timestamp'] < current_week_start]

            # Include data from four weeks before the current week
            four_weeks_ago = current_week_start - pd.Timedelta(days=28)
            category_df = category_df[category_df['timestamp'] >= four_weeks_ago]

            if len(category_df) < 14:  # Need at least 2 weeks of data (14 entries minimum)
                return None, f"Insufficient data for {category} category. Need at least 2 weeks of data."

            # Group by weeks (oldest to newest)
            category_df['week_number'] = ((category_df['timestamp'] - four_weeks_ago).dt.days // 7).astype(int)
            category_df = category_df[category_df['week_number'] < 4]  # Only 4 weeks

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

                # Count mood occurrences per week
                mood_week_counts = defaultdict(lambda: [0, 0, 0, 0])  # 4 weeks
                activity_mood_mapping = defaultdict(list)
                
                for _, row in day_data.iterrows():
                    week_idx = row['week_number']
                    after_emotion = row['afterEmotion'].lower() if row['afterEmotion'] else 'unknown'
                    
                    # Skip unknown emotions
                    if after_emotion in self.all_emotions:
                        mood_week_counts[after_emotion][week_idx] += 1
                        
                        # Track activities/causes for this mood
                        if category == 'sleep':
                            activity_mood_mapping[after_emotion].append(f"{row.get('hrs', 0)} hours of sleep")
                        else:
                            activity_mood_mapping[after_emotion].append(row.get('activity', 'Unknown activity'))

                # Calculate weighted frequencies
                mood_weighted_frequencies = {}
                total_weighted_frequency = 0
                
                for mood, week_counts in mood_week_counts.items():
                    weighted_freq = sum(count * weight for count, weight in zip(week_counts, self.week_weights))
                    mood_weighted_frequencies[mood] = weighted_freq
                    total_weighted_frequency += weighted_freq

                if total_weighted_frequency == 0:
                    day_predictions[day] = {
                        'predicted_mood': 'No valid data',
                        'probability': 0.0,
                        'cause': 'No emotions recorded'
                    }
                    continue

                # Calculate probabilities and find predicted mood
                mood_probabilities = {}
                for mood, weighted_freq in mood_weighted_frequencies.items():
                    probability = weighted_freq / total_weighted_frequency
                    mood_probabilities[mood] = probability

                # Get the mood with highest probability
                predicted_mood = max(mood_probabilities.items(), key=lambda x: x[1])
                predicted_emotion = predicted_mood[0]
                predicted_probability = predicted_mood[1]

                # Get the most common cause for this predicted mood
                causes = activity_mood_mapping.get(predicted_emotion, [])
                if causes:
                    # Get most frequent cause
                    cause_counts = pd.Series(causes).value_counts()
                    most_common_cause = cause_counts.index[0]
                else:
                    most_common_cause = 'Unknown cause'

                day_predictions[day] = {
                    'predicted_mood': predicted_emotion.capitalize(),
                    'probability': round(predicted_probability * 100, 1),
                    'cause': most_common_cause
                }

            return day_predictions, None

        except Exception as e:
            logger.error(f"Error in prepare_category_data for {category}: {str(e)}")
            return None, str(e)

    def check_category_data_availability(self, mood_logs):
        """
        Check which categories have sufficient data (at least 2 weeks)
        """
        available_categories = {}
        
        for category in self.categories:
            category_data, error = self.prepare_category_data(mood_logs, category)
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
        predictions, error = predictor.prepare_category_data(mood_logs, category)
        
        if error:
            return {'error': error}
        
        return {'predictions': predictions}
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
            'predictions': result['predictions']
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

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)