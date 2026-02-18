import nltk
from textblob import download_corpora

# Ensure required NLTK corpora exist
nltk_data_path = "/opt/render/nltk_data"  # persistent folder in Render
nltk.data.path.append(nltk_data_path)

# Download only once at startup
nltk.download('punkt', download_dir=nltk_data_path)
nltk.download('wordnet', download_dir=nltk_data_path)
nltk.download('averaged_perceptron_tagger', download_dir=nltk_data_path)
nltk.download('movie_reviews', download_dir=nltk_data_path)
nltk.download('conll2000', download_dir=nltk_data_path)

# TextBlob corpora
download_corpora.download_all()


from flask import Flask
from flask_cors import CORS
import logging
import os

from recommendation_sentiment import bp as sentiment_bp
from concordance import ccc_bp as concordance_bp
from prediction import bp as prediction_bp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

app.register_blueprint(sentiment_bp)
app.register_blueprint(concordance_bp)  # CCC endpoints (/api/ccc/run)
app.register_blueprint(prediction_bp)

@app.route('/', methods=['GET'])
def root():
    return {'message': 'Backend is running!'}

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy', 'service': 'combined-python-services'}

if __name__ == '__main__':
    port = int(os.environ.get("PYTHON_PORT", 5001))
    print(f"Starting Combined Python Services on port {port}...")
    app.run(host='0.0.0.0', port=port)