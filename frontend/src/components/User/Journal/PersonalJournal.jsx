import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import CircularProgress from '@mui/material/CircularProgress';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import InsightsIcon from '@mui/icons-material/Insights';
import ViewListIcon from '@mui/icons-material/ViewList';
import CreateIcon from '@mui/icons-material/Create';
import BottomNav from '../../BottomNav';

const PersonalJournal = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentResult, setSentimentResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentVerySatisfiedIcon style={{ color: '#4CAF50', fontSize: 40 }} />;
      case 'negative':
        return <SentimentVeryDissatisfiedIcon style={{ color: '#f44336', fontSize: 40 }} />;
      default:
        return <SentimentNeutralIcon style={{ color: '#FF9800', fontSize: 40 }} />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'from-green-100 to-green-200 border-green-300';
      case 'negative':
        return 'from-red-100 to-red-200 border-red-300';
      default:
        return 'from-orange-100 to-orange-200 border-orange-300';
    }
  };

  const getSentimentMessage = (sentiment, confidence) => {
    const confidenceLevel = confidence > 0.7 ? 'strong' : confidence > 0.4 ? 'moderate' : 'mild';
    
    switch (sentiment) {
      case 'positive':
        return `We detected ${confidenceLevel} positive emotions in your writing! ✨`;
      case 'negative':
        return `We noticed some ${confidenceLevel} challenging emotions. Remember, it's okay to feel this way. 💙`;
      default:
        return `Your emotions seem balanced today. That's perfectly normal! 🌸`;
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    if (content.length < 10) {
      toast.error('Journal content must be at least 10 characters long');
      return;
    }

    setIsAnalyzing(true);
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_NODE_API}/api/personal-journal`,
        {
          title: title.trim(),
          content: content.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSentimentResult(response.data.sentimentAnalysis);
        toast.success('Journal entry saved and analyzed successfully!');
        // Removed the automatic redirect timeout
      }
    } catch (error) {
      console.error('Error saving journal:', error);
      if (error.response?.status === 503) {
        toast.error('Sentiment analysis service is currently unavailable. Your journal was saved without analysis.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save journal entry');
      }
    } finally {
      setIsAnalyzing(false);
      setIsSaving(false);
    }
  };

  const handleViewJournalLogs = () => {
    navigate('/journal-logs');
  };

  const handleWriteAnother = () => {
    // Reset the form for a new entry
    setTitle('');
    setContent('');
    setSentimentResult(null);
    toast.info('Ready for your next journal entry!');
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <div className="bg-gradient-to-br from-[#e8f5e8] to-[#d4f1d4] min-h-screen flex flex-col">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-md py-4 shadow-lg sticky top-0 z-10 border-b border-green-100">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/journal-logs')}
            className="flex items-center space-x-2 text-[#6fba94] hover:text-[#4e8067] transition-colors"
          >
            <ArrowBackIcon />
            <span className="font-medium">Back</span>
          </motion.button>
          
          <h1 className="text-xl font-bold text-gray-800">Personal Journal</h1>
          
          {/* Only show save button if no results yet */}
          {!sentimentResult && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-all ${
                isSaving || !title.trim() || !content.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isSaving ? (
                <CircularProgress size={16} style={{ color: 'white' }} />
              ) : (
                <SaveIcon style={{ fontSize: 18 }} />
              )}
              <span>{isSaving ? 'Analyzing...' : 'Save & Analyze'}</span>
            </motion.button>
          )}

          {/* Show action buttons after analysis */}
          {sentimentResult && (
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWriteAnother}
                className="flex items-center space-x-2 px-3 py-2 rounded-full font-semibold bg-gradient-to-r from-[#5ca57f] to-[#4e8067] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <CreateIcon style={{ fontSize: 16 }} />
                <span className="hidden sm:inline">Write Another</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewJournalLogs}
                className="flex items-center space-x-2 px-3 py-2 rounded-full font-semibold bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <ViewListIcon style={{ fontSize: 16 }} />
                <span className="hidden sm:inline">View All</span>
              </motion.button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-green-100"
        >
          {/* Only show form if no results yet */}
          {!sentimentResult && (
            <>
              {/* Title Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Journal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your journal entry a meaningful title..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-green-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#6fba94] focus:border-transparent transition-all text-lg"
                  maxLength={200}
                  disabled={isAnalyzing}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {title.length}/200 characters
                </div>
              </div>

              {/* Content Textarea */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Thoughts & Feelings
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Express yourself freely... Write about your day, feelings, thoughts, goals, challenges, or anything that's on your mind. This is your safe space to be authentic and honest with yourself."
                  className="w-full px-4 py-3 rounded-xl border-2 border-green-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#6fba94] focus:border-transparent transition-all resize-none"
                  rows={12}
                  style={{ minHeight: '300px' }}
                  disabled={isAnalyzing}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <div className="flex space-x-4">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                    {wordCount > 0 && (
                      <span>{readingTime} min read</span>
                    )}
                  </div>
                  <span className={`${content.length < 10 ? 'text-red-500' : 'text-green-500'}`}>
                    {content.length < 10 ? `${10 - content.length} more characters needed` : 'Ready to analyze!'}
                  </span>
                </div>
              </div>

              {/* Writing Tips */}
              {!isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-4 mb-6 border border-blue-200"
                >
                  <div className="flex items-start space-x-3">
                    <LightbulbIcon style={{ color: '#3B82F6', fontSize: 24 }} />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">Writing Tips</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Be honest about your feelings - this helps with accurate analysis</li>
                        <li>• Write in detail about specific events or emotions</li>
                        <li>• Don't worry about grammar - focus on expressing yourself</li>
                        <li>• The more you write, the better the sentiment analysis will be</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Sentiment Analysis Results */}
          {sentimentResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-gradient-to-r ${getSentimentColor(sentimentResult.sentiment)} rounded-2xl p-6 border-2 mb-6`}
            >
              <div className="flex items-center justify-center mb-6">
                {getSentimentIcon(sentimentResult.sentiment)}
                <div className="ml-4 text-center">
                  <h3 className="text-2xl font-bold capitalize text-gray-800 mb-1">
                    {sentimentResult.sentiment} Sentiment
                  </h3>
                  <p className="text-lg text-gray-700">
                    {getSentimentMessage(sentimentResult.sentiment, sentimentResult.confidence)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Confidence: {Math.round(sentimentResult.confidence * 100)}% • {sentimentResult.word_count} words analyzed
                  </p>
                </div>
              </div>

              {/* Insights */}
              {sentimentResult.insights && sentimentResult.insights.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <InsightsIcon style={{ color: '#6B7280', fontSize: 20 }} />
                    <h4 className="font-semibold text-gray-800 ml-2">AI Insights</h4>
                  </div>
                  <div className="space-y-2">
                    {sentimentResult.insights.map((insight, index) => (
                      <div key={index} className="bg-white/70 rounded-lg p-3 border border-white/50">
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {sentimentResult.suggestions && sentimentResult.suggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <LightbulbIcon style={{ color: '#F59E0B', fontSize: 20 }} />
                    <h4 className="font-semibold text-gray-800 ml-2">Personalized Suggestions</h4>
                  </div>
                  <div className="space-y-2">
                    {sentimentResult.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="bg-white/70 rounded-lg p-3 border border-white/50">
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Scores */}
              <div className="bg-white/50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-center">Analysis Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Emotional Intensity</p>
                    <p className="font-bold text-lg text-gray-800">
                      {Math.round(sentimentResult.scores.textblob.subjectivity * 100)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Overall Score</p>
                    <p className="font-bold text-lg text-gray-800">
                      {sentimentResult.scores.combined > 0 ? '+' : ''}{sentimentResult.scores.combined.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWriteAnother}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#5ca57f] to-[#4e8067] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <CreateIcon style={{ fontSize: 20 }} />
                  <span>Write Another Entry</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewJournalLogs}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <ViewListIcon style={{ fontSize: 20 }} />
                  <span>View All Journal Entries</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && !sentimentResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-2xl p-8 border-2 border-purple-200 text-center"
            >
              <CircularProgress size={50} style={{ color: '#6fba94', marginBottom: '16px' }} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Analyzing your journal entry...
              </h3>
              <p className="text-gray-600 mb-4">
                Our AI is reading your thoughts and emotions
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-[#6fba94] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#6fba94] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#6fba94] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value="journal" setValue={() => {}} />
      </div>
    </div>
  );
};

export default PersonalJournal;