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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class MoodPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.label_encoder = LabelEncoder()
        self.days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        self.mood_categories = ['happy', 'fine', 'anxious', 'sad', 'angry']
        # Set a random seed based on current timestamp
        np.random.seed(int(pd.Timestamp.now().timestamp()))
        
    def train(self, X, y):
        """
        Train the model with the prepared data
        
        Parameters:
        X (pd.DataFrame): Feature matrix with one-hot encoded days
        y (pd.Series): Target variable with encoded moods
        """
        try:
            logger.info("Training model...")
            self.model.fit(X, y)
            logger.info("Model training completed")
        except Exception as e:
            logger.error(f"Error in training: {str(e)}")
            raise

    def prepare_data(self, mood_logs):
        try:
            np.random.seed(int(pd.Timestamp.now().timestamp()))
            
            df = pd.DataFrame(mood_logs)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['day_of_week'] = df['timestamp'].dt.day_name()
            df = df.sort_values('timestamp', ascending=False)

            most_recent = df['timestamp'].max()
            current_date = pd.Timestamp.now(tz=most_recent.tz).date()

            # Always get Monday of the current week
            current_week_monday = current_date - pd.Timedelta(days=current_date.weekday())  

            # Ensure the time is set to the start of Monday
            current_week_start = pd.Timestamp.combine(current_week_monday, datetime.min.time()).tz_localize(most_recent.tz)

            # Exclude data from Monday of this week through Sunday
            df = df[df['timestamp'] < current_week_start]

            # Include data from four weeks before the current week
            four_weeks_ago = current_week_start - pd.Timedelta(days=28)

            processed_data = []

            for day in self.days_of_week:
                day_data = df[(df['day_of_week'] == day) & (df['timestamp'] >= four_weeks_ago)]

                if not day_data.empty:
                    # Group by date to handle multiple moods per day
                    daily_groups = day_data.groupby(day_data['timestamp'].dt.date)
                    
                    daily_averages = []
                    daily_top_activities = []
                    
                    for date, group in daily_groups:
                        # Average mood scores for each day
                        avg_mood_score = group['moodScore'].mean()
                        daily_averages.append(avg_mood_score)
                        
                        # Collect all activities for the day
                        all_day_activities = []
                        for activities in group['activities']:
                            if isinstance(activities, list):
                                all_day_activities.extend(activities)

                        # Find most occurring activity for this specific day (pick only one)
                        day_most_occurring = None
                        if all_day_activities:
                            activity_counts = pd.Series(all_day_activities).value_counts()
                            day_most_occurring = activity_counts.index[0]  # Get only the top one
                            daily_top_activities.append(day_most_occurring)
                    
                    # Average the daily averages to get final prediction for this day
                    final_avg_score = np.mean(daily_averages) if daily_averages else 0
                    
                    # Find most occurring activities across all past weeks for this day
                    selected_activities = []
                    if daily_top_activities:
                        # Step 1: Count how many times each activity was the top per week
                        week_activity_counts = pd.Series(daily_top_activities).value_counts()
                        max_count = week_activity_counts.iloc[0]
                        most_frequent = week_activity_counts[week_activity_counts == max_count]

                        if max_count >= 2:
                            if len(most_frequent) == 1:
                                # One clearly most frequent activity
                                selected_activities = [most_frequent.index[0]]
                            else:
                                # Tie (each appears at least twice)
                                selected_activities = most_frequent.index[:2].tolist()
                        else:
                            # Fallback: Use top 1–2 frequent activities from most recent week's same day
                            recent_day = df[df['day_of_week'] == day].sort_values('timestamp', ascending=False)

                            # Get only the most recent date's logs
                            if not recent_day.empty:
                                most_recent_date = recent_day['timestamp'].dt.date.iloc[0]
                                same_day_recent_logs = recent_day[recent_day['timestamp'].dt.date == most_recent_date]

                                # Aggregate activities for that most recent weekday
                                all_recent_activities = []
                                for acts in same_day_recent_logs['activities']:
                                    if isinstance(acts, list):
                                        all_recent_activities.extend(acts)

                                if all_recent_activities:
                                    counts = pd.Series(all_recent_activities).value_counts()
                                    selected_activities = counts.index[:2].tolist()
                                else:
                                    selected_activities = []
                            else:
                                selected_activities = []
                    else:
                        selected_activities = []

                    
                    # Convert average mood score back to mood category
                    # Assuming mood score ranges: happy=4, fine=2, anxious=0, sad=-3, angry=-1
                    if final_avg_score >= 3:  # Closer to happy (4)
                        predicted_mood = 'happy'
                    elif final_avg_score >= 1:  # Closer to fine (2)
                        predicted_mood = 'fine'
                    elif final_avg_score >= -0.5:  # Closer to anxious (0)
                        predicted_mood = 'anxious'
                    elif final_avg_score >= -2:  # Closer to angry (-1)
                        predicted_mood = 'angry'
                    elif final_avg_score >= -3:  # Closer to sad (-3)
                        predicted_mood = 'sad'
                    else:
                        predicted_mood = 'unknown'

                    processed_data.append({
                        'day_of_week': day,
                        'mood': predicted_mood,
                        'mood_score': final_avg_score,
                        'major_activities': selected_activities
                    })
                else:
                    processed_data.append({
                        'day_of_week': day,
                        'mood': 'unknown',
                        'mood_score': 0,
                        'major_activities': []
                    })

            processed_df = pd.DataFrame(processed_data)

            self.label_encoder.fit(self.mood_categories + ['unknown'])
            processed_df['mood_encoded'] = self.label_encoder.transform(processed_df['mood'])

            X = pd.get_dummies(processed_df['day_of_week'])
            X = X.reindex(columns=self.days_of_week, fill_value=0)
            y = processed_df['mood_encoded']

            self.daily_activities = dict(zip(processed_df['day_of_week'], processed_df['major_activities']))

            return X, y

        except Exception as e:
            logger.error(f"Error in prepare_data: {str(e)}")
            raise

    def predict_weekly_moods(self):
        try:
            test_data = pd.DataFrame(index=self.days_of_week)
            test_X = pd.get_dummies(test_data.index)
            test_X = test_X.reindex(columns=self.days_of_week, fill_value=0)

            predictions = self.model.predict(test_X)
            predicted_moods = self.label_encoder.inverse_transform(predictions)

            weekly_predictions = {}
            for day, mood in zip(self.days_of_week, predicted_moods):
                activities = self.daily_activities.get(day, [])
                weekly_predictions[day] = {
                    'mood': mood if mood != 'unknown' else 'No prediction available',
                    'activities': activities
                }

            return {'daily_predictions': weekly_predictions}

        except Exception as e:
            logger.error(f"Error in predict_weekly_moods: {str(e)}")
            raise

def predict_mood(mood_logs):
    try:
        predictor = MoodPredictor()
        X, y = predictor.prepare_data(mood_logs)
        predictor.train(X, y)
        predictions = predictor.predict_weekly_moods()
        return predictions
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return {'error': str(e)}
   
@app.route('/api/predict-mood', methods=['GET'])
def get_prediction_from_node():
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
            f"{node_api}/api/mood-logs", 
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
        
        if len(mood_logs) < 7:
            return jsonify({
                'success': True,
                'predictions': {},
                'message': 'Need at least one week of mood data for predictions'
            })
        
        # Format logs
        formatted_logs = []
        for log in mood_logs:
            formatted_logs.append({
                'mood': log.get('mood', '').lower(),
                'moodScore': log.get('moodScore', 0),
                'timestamp': log.get('date'),
                'activities': log.get('activities', [])
            })
            
        # Get predictions
        result = predict_mood(formatted_logs)
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'message': result['error']
            }), 500
            
        return jsonify({
            'success': True,
            'predictions': result['daily_predictions']
        })
        
    except Exception as e:
        logger.error(f"API Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)