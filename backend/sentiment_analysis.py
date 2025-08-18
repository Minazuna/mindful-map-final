from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

analyzer = SentimentIntensityAnalyzer()

def clean_text(text):
    """Clean and preprocess text for sentiment analysis"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def get_sentiment_score(text):
    """Get sentiment scores using both TextBlob and VADER"""
    try:
        # Clean the text
        clean_text_input = clean_text(text)
        
        # TextBlob analysis
        blob = TextBlob(clean_text_input)
        textblob_polarity = blob.sentiment.polarity
        textblob_subjectivity = blob.sentiment.subjectivity
        
        # VADER analysis
        vader_scores = analyzer.polarity_scores(clean_text_input)
        
        # Combine scores for more accurate results
        combined_score = (textblob_polarity + vader_scores['compound']) / 2
        
        # Determine sentiment category
        if combined_score >= 0.1:
            sentiment = 'positive'
        elif combined_score <= -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            'sentiment': sentiment,
            'confidence': abs(combined_score),
            'scores': {
                'textblob': {
                    'polarity': textblob_polarity,
                    'subjectivity': textblob_subjectivity
                },
                'vader': vader_scores,
                'combined': combined_score
            }
        }
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        raise

def get_suggestions(sentiment):
    """Get suggestions based on sentiment"""
    suggestions = {
        'positive': [
            "Great to see you're feeling positive! Keep up the good vibes.",
            "Your positivity is wonderful. Consider sharing this energy with others.",
            "It's beautiful to read such uplifting thoughts!",
            "This positive energy is contagious - keep spreading joy!"
        ],
        'negative': [
            "It's okay to have difficult days. Consider talking to someone you trust.",
            "Remember that tough times don't last, but resilient people do.",
            "Consider practicing some self-care activities that make you feel better.",
            "Every storm runs out of rain. This feeling will pass.",
            "Try deep breathing or meditation to help center yourself."
        ],
        'neutral': [
            "Your thoughts seem balanced today.",
            "Sometimes neutral days are exactly what we need.",
            "Consider reflecting on what might bring you more joy today.",
            "Neutral feelings are valid too - it's okay to feel calm and steady."
        ]
    }
    return suggestions.get(sentiment, [])

def get_mood_insights(sentiment, confidence):
    """Provide insights based on sentiment and confidence level"""
    insights = []
    
    if confidence > 0.7:
        insights.append(f"Strong {sentiment} sentiment detected with high confidence.")
    elif confidence > 0.4:
        insights.append(f"Moderate {sentiment} sentiment detected.")
    else:
        insights.append("Mixed emotions detected - this is completely normal.")
    
    if sentiment == 'positive' and confidence > 0.6:
        insights.append("Consider what specifically made you feel this way and try to incorporate more of it.")
    elif sentiment == 'negative' and confidence > 0.6:
        insights.append("It might help to identify specific triggers and develop coping strategies.")
    
    return insights

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text or len(text.strip()) < 10:
            return jsonify({
                'success': False,
                'error': 'Text must be at least 10 characters long'
            }), 400
        
        result = get_sentiment_score(text)
        suggestions = get_suggestions(result['sentiment'])
        insights = get_mood_insights(result['sentiment'], result['confidence'])
        
        return jsonify({
            'success': True,
            'sentiment': result['sentiment'],
            'confidence': round(result['confidence'], 3),
            'scores': result['scores'],
            'suggestions': suggestions,
            'insights': insights,
            'word_count': len(text.split())
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_sentiment endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'sentiment-analysis'
    })

@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple texts at once"""
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts or not isinstance(texts, list):
            return jsonify({
                'success': False,
                'error': 'Please provide an array of texts'
            }), 400
        
        results = []
        for i, text in enumerate(texts):
            if len(text.strip()) >= 10:
                result = get_sentiment_score(text)
                results.append({
                    'index': i,
                    'sentiment': result['sentiment'],
                    'confidence': round(result['confidence'], 3),
                    'text_preview': text[:50] + '...' if len(text) > 50 else text
                })
            else:
                results.append({
                    'index': i,
                    'error': 'Text too short',
                    'text_preview': text
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'total_analyzed': len([r for r in results if 'sentiment' in r])
        })
        
    except Exception as e:
        logger.error(f"Error in batch_analyze endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Sentiment Analysis Service on port 5001...")
    app.run(debug=True, host='0.0.0.0', port=5001)