import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../../BottomNav';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

// Challenge benefits descriptions for the help modal
const challengeBenefits = {
  Monday: "The Gratitude Challenge helps you recognize the positive aspects in your life. Research shows practicing gratitude regularly can improve mental health, increase happiness, and reduce stress levels. It shifts your focus from what's lacking to what's abundant in your life.",
  Tuesday: "The Self-Love Challenge encourages positive self-perception and healthy self-esteem. Acknowledging your own positive qualities builds resilience against criticism, increases confidence, and improves your overall relationship with yourself.",
  Wednesday: "The Achievement Challenge helps you recognize your accomplishments, boosting self-confidence and motivation. Reflecting on past successes can provide the inspiration needed to overcome current challenges and set meaningful future goals.",
  Thursday: "The Kindness Challenge promotes empathy and connection with others. Acknowledging acts of kindness—whether given or received—strengthens social bonds and releases endorphins that improve your mood and overall well-being.",
  Friday: "The Hobby Challenge reminds you of activities that bring joy and fulfillment. Regularly engaging in enjoyable activities reduces stress, provides a healthy outlet for self-expression, and helps maintain work-life balance.",
  Saturday: "The Relaxation Challenge helps identify effective personal stress-relief methods. Recognizing and practicing these techniques improves your ability to manage anxiety, enhances sleep quality, and supports overall mental well-being.",
  Sunday: "The Reflection Challenge promotes self-awareness and personal growth. Taking time to consider what you've learned helps integrate experiences into wisdom, identifies patterns in your life, and prepares you for a more mindful week ahead."
};

const challenges = {
  Monday: {
    title: 'Gratitude Challenge',
    description: 'List 5 people/things you are grateful for.',
    fields: [
      { placeholder: 'Person/Thing 1', state: 'gratitude1' },
      { placeholder: 'Person/Thing 2', state: 'gratitude2' },
      { placeholder: 'Person/Thing 3', state: 'gratitude3' },
      { placeholder: 'Person/Thing 4', state: 'gratitude4' },
      { placeholder: 'Person/Thing 5', state: 'gratitude5' },
    ],
    recommendations: [
      'Family', 'Good food', 'A warm blanket', 'An affectionate pet', 'Friends', 'Health', 'Nature', 'A good book',
      'Sunshine', 'A cozy home', 'Music', 'Laughter', 'Clean water', 'Education', 'A comfortable bed', 'Technology',
      'Art', 'Freedom', 'Love', 'Opportunities', 'Happiness', 'Peace'
    ]
  },
  Tuesday: {
    title: 'Self-Love Challenge',
    description: 'List 3 things you like about yourself.',
    fields: [
      { placeholder: 'Thing 1', state: 'selfLove1' },
      { placeholder: 'Thing 2', state: 'selfLove2' },
      { placeholder: 'Thing 3', state: 'selfLove3' },
    ],
    recommendations: [
      'Kindness', 'Creativity', 'Resilience', 'Sense of humor', 'Empathy', 'Intelligence', 'Patience', 'Determination',
      'Honesty', 'Courage', 'Generosity', 'Adaptability', 'Confidence', 'Optimism', 'Loyalty', 'Humility',
      'Compassion', 'Curiosity', 'Discipline', 'Positivity'
    ]
  },
  Wednesday: {
    title: 'Achievement Challenge',
    description: 'List 3 achievements you are proud of.',
    fields: [
      { placeholder: 'Achievement 1', state: 'achievement1' },
      { placeholder: 'Achievement 2', state: 'achievement2' },
      { placeholder: 'Achievement 3', state: 'achievement3' },
    ],
    recommendations: [
      'Graduation', 'Job promotion', 'Learning a new skill', 'Helping others', 'Personal growth', 'Fitness goals',
      'Creative projects', 'Overcoming challenges', 'Travel experiences', 'Building relationships', 'Starting a business',
      'Volunteering', 'Public speaking', 'Writing a book', 'Completing a marathon', 'Financial independence',
      'Raising a family', 'Mentoring others', 'Achieving work-life balance', 'Winning an award'
    ]
  },
  Thursday: {
    title: 'Kindness Challenge',
    description: 'List 3 acts of kindness you have done or witnessed.',
    fields: [
      { placeholder: 'Act of Kindness 1', state: 'kindness1' },
      { placeholder: 'Act of Kindness 2', state: 'kindness2' },
      { placeholder: 'Act of Kindness 3', state: 'kindness3' },
    ],
    recommendations: [
      'Helping a neighbor', 'Volunteering', 'Donating to charity', 'Listening to someone', 'Complimenting others',
      'Sharing a meal', 'Supporting a friend', 'Random acts of kindness', 'Paying it forward', 'Offering a ride',
      'Babysitting for free', 'Helping with groceries', 'Writing a thank-you note', 'Visiting the elderly',
      'Cleaning up litter', 'Donating clothes', 'Helping with homework', 'Offering a smile', 'Giving directions',
      'Planting a tree'
    ]
  },
  Friday: {
    title: 'Hobby Challenge',
    description: 'List 3 hobbies or activities you enjoy.',
    fields: [
      { placeholder: 'Hobby/Activity 1', state: 'hobby1' },
      { placeholder: 'Hobby/Activity 2', state: 'hobby2' },
      { placeholder: 'Hobby/Activity 3', state: 'hobby3' },
    ],
    recommendations: [
      'Reading', 'Gardening', 'Cooking', 'Painting', 'Hiking', 'Playing an instrument', 'Writing', 'Photography',
      'Dancing', 'Knitting', 'Fishing', 'Cycling', 'Traveling', 'Bird watching', 'Pottery', 'Scrapbooking',
      'Woodworking', 'Yoga', 'Gaming', 'Swimming'
    ]
  },
  Saturday: {
    title: 'Relaxation Challenge',
    description: 'List 3 ways you relax and unwind.',
    fields: [
      { placeholder: 'Relaxation Method 1', state: 'relaxation1' },
      { placeholder: 'Relaxation Method 2', state: 'relaxation2' },
      { placeholder: 'Relaxation Method 3', state: 'relaxation3' },
    ],
    recommendations: [
      'Meditation', 'Reading a book', 'Taking a bath', 'Listening to music', 'Walking in nature', 'Yoga', 'Watching a movie',
      'Journaling', 'Deep breathing', 'Aromatherapy', 'Stretching', 'Napping', 'Drawing', 'Gardening', 'Cooking',
      'Spending time with pets', 'Crafting', 'Playing a musical instrument', 'Practicing mindfulness', 'Stargazing'
    ]
  },
  Sunday: {
    title: 'Reflection Challenge',
    description: 'Reflect on the past week and list 3 things you learned.',
    fields: [
      { placeholder: 'Lesson 1', state: 'lesson1' },
      { placeholder: 'Lesson 2', state: 'lesson2' },
      { placeholder: 'Lesson 3', state: 'lesson3' },
    ],
    recommendations: [
      'Patience', 'Gratitude', 'Self-awareness', 'Empathy', 'Time management', 'Problem-solving', 'Communication',
      'Adaptability', 'Resilience', 'Forgiveness', 'Mindfulness', 'Teamwork', 'Leadership', 'Conflict resolution',
      'Critical thinking', 'Decision making', 'Stress management', 'Goal setting', 'Self-discipline', 'Work-life balance'
    ]
  },
};

const JournalEntry = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [challengeData, setChallengeData] = useState({});
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const challenge = challenges[currentDay];

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('challenge', JSON.stringify(challenge));
      formData.append('challengeData', JSON.stringify(challengeData));
      images.forEach((image) => {
        formData.append('images', image);
      });

      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/journal`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Journal entry saved:', response.data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to log journal entry.');
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  const handleImageClick = (image) => {
    setSelectedImage(URL.createObjectURL(image));
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleBackClick = () => {
    navigate('/journal-logs');
  };

  const handleWarningModalClose = () => {
    setShowWarningModal(false);
  };

  const handleWarningModalProceed = () => {
    setShowWarningModal(false);
    handleSave();
  };

  const handleChallengeInputChange = (field, value) => {
    setChallengeData((prevData) => ({ ...prevData, [field]: value }));
  };

  const handleRecommendationClick = (field, recommendation) => {
    setChallengeData((prevData) => ({ ...prevData, [field]: recommendation }));
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const toggleRecommendations = (field) => {
    setActiveField(activeField === field ? null : field);
    setShowAllRecommendations(!showAllRecommendations);
  };

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  const handleCloseHelpModal = () => {
    setShowHelpModal(false);
  };

  const handleFinishClick = () => {
    setShowSuccessModal(false);
    navigate('/journal-logs');
  };

  const getRecommendations = (field) => {
    const usedRecommendations = Object.values(challengeData);
    
    if (showAllRecommendations && activeField === field) {
      // Show all available recommendations for this field
      return challenge.recommendations.filter(
        (rec) => !usedRecommendations.includes(rec)
      );
    }
    
    // Otherwise show just a few suggestions
    const availableRecommendations = challenge.recommendations.filter(
      (rec) => !usedRecommendations.includes(rec)
    );

    // Ensure each input box has unique recommendations
    const recommendations = [];
    const numToShow = availableRecommendations.length < 4 ? availableRecommendations.length : 4;
    
    for (let i = 0; i < numToShow; i++) {
      const randomIndex = Math.floor(Math.random() * availableRecommendations.length);
      recommendations.push(availableRecommendations[randomIndex]);
      availableRecommendations.splice(randomIndex, 1);
    }

    return recommendations;
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getFieldProgressStatus = () => {
    const totalFields = challenge.fields.length;
    const filledFields = challenge.fields.filter(field => 
      challengeData[field.state] && challengeData[field.state].trim() !== ''
    ).length;
    
    return {
      percentage: (filledFields / totalFields) * 100,
      filledFields,
      totalFields
    };
  };

  const progress = getFieldProgressStatus();

  return (
    <div className="bg-[#b4ddc8] min-h-screen flex flex-col">
      {/* Header */}
      <nav className="bg-white py-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center">
            <ArrowBackIcon 
              className="cursor-pointer text-[#64aa86] mr-2" 
              onClick={handleBackClick} 
            />
            <h1 className="text-xl font-semibold text-gray-800">{currentDay}'s Journal</h1>
          </div>
          <div className="text-gray-500 font-medium">{currentDate}</div>
          <button
            onClick={handleSave}
            className="bg-[#64aa86] hover:bg-[#4e8067] text-white font-medium py-2 px-4 rounded-full flex items-center transition-colors duration-300"
          >
            <SaveIcon className="mr-1" fontSize="small" />
            Save
          </button>
        </div>
      </nav>

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto pb-16 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Challenge header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6 relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="pr-8 flex items-center">
                <h2 className="text-2xl font-bold text-[#64aa86]">{challenge.title}</h2>
                {/* Question mark help icon - Moved next to title */}
                <div 
                  className="ml-2 cursor-pointer text-[#64aa86] hover:text-[#4e8067] transition-colors duration-200 flex items-center"
                  onClick={handleHelpClick}
                >
                  <HelpOutlineIcon fontSize="small" />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="w-12 h-12 rounded-full bg-[#e9f5ef] flex items-center justify-center text-[#64aa86] font-bold text-lg border-2 border-[#64aa86]">
                  {progress.filledFields}/{progress.totalFields}
                </div>
                <p className="text-xs text-gray-500 mt-1">Fields complete</p>
              </div>
            </div>
            
            <p className="text-gray-600 mt-1 text-lg">{challenge.description}</p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 mt-4">
              <div 
                className="bg-[#64aa86] h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </motion.div>

          {/* Challenge fields */}
          {challenge.fields.map((field, index) => (
            <motion.div 
              key={field.state}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 mb-4"
            >
              <div className="mb-3">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-base font-medium text-gray-700">{field.placeholder}</label>
                  <div 
                    className="flex items-center text-sm text-[#64aa86] hover:text-[#4e8067] cursor-pointer"
                    onClick={() => toggleRecommendations(field.state)}
                  >
                    <img 
                      src="/images/idea.gif" 
                      alt="Ideas" 
                      className="w-7 h-7 mr-1" 
                    />
                    {activeField === field.state ? "Hide ideas" : "Show ideas"}
                  </div>
                </div>
                <textarea
                  className="w-full p-4 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#64aa86] focus:border-transparent transition duration-200"
                  placeholder={`Write your ${field.placeholder.toLowerCase()} here...`}
                  value={challengeData[field.state] || ''}
                  onChange={(e) => handleChallengeInputChange(field.state, e.target.value)}
                  rows="4"
                />
              </div>
              {/* Recommendations */}
              <motion.div 
                className="flex flex-wrap gap-2 mt-4"
                animate={{ height: getRecommendations(field.state).length > 0 ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
              >
                {getRecommendations(field.state).map((recommendation, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="bg-[#e9f5ef] text-[#64aa86] px-4 py-2 rounded-full cursor-pointer hover:bg-[#64aa86] hover:text-white transition-colors duration-200 text-base font-medium"
                    onClick={() => handleRecommendationClick(field.state, recommendation)}
                  >
                    {recommendation}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          ))}

          {/* Photo upload section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: challenge.fields.length * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="font-medium text-gray-700 text-lg mb-4">Add Photos</h3>
            
            <div className="flex items-center mb-4">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="image-upload"
                className="flex items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#64aa86] transition-colors duration-200"
              >
                <ImageIcon
                  className="text-[#64aa86]"
                  style={{ fontSize: 40 }}
                />
              </label>
              <p className="ml-5 text-base text-gray-600">
                Upload photos to supplement your journal entry. <br/>
                Click the icon to select images.
              </p>
            </div>
            
            {/* Image preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`upload-${index}`}
                    className="w-full h-32 object-cover cursor-pointer rounded-lg shadow-sm"
                    onClick={() => handleImageClick(image)}
                  />
                  <div 
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value="journal" setValue={() => {}} />
      </div>

      {/* Challenge help modal */}
      <Modal
        open={showHelpModal}
        onClose={handleCloseHelpModal}
        aria-labelledby="help-modal-title"
        className="flex items-center justify-center"
      >
        <Box className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4 outline-none">
          <h2 id="help-modal-title" className="text-xl font-bold text-[#64aa86] mb-3">
            About the {challenge.title}
          </h2>
          <p className="text-gray-700 mb-4">
            {challengeBenefits[currentDay]}
          </p>
          <div className="flex justify-center mt-6">
            <button
              onClick={handleCloseHelpModal}
              className="px-4 py-2 bg-[#64aa86] text-white rounded-lg hover:bg-[#4e8067] transition-colors duration-300"
            >
              Got it!
            </button>
          </div>
        </Box>
      </Modal>

      {/* Image preview modal */}
      <Modal 
        open={!!selectedImage} 
        onClose={handleCloseModal}
        className="flex items-center justify-center"
      >
        <Box className="relative outline-none">
          <img src={selectedImage} alt="Selected" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
          <div 
            className="absolute top-4 right-4 bg-black bg-opacity-50 p-2 rounded-full cursor-pointer hover:bg-opacity-70 transition-colors duration-200"
            onClick={handleCloseModal}
          >
            <CloseIcon className="text-white" fontSize="medium" />
          </div>
        </Box>
      </Modal>

      {/* Success modal */}
      <Modal 
        open={showSuccessModal} 
        onClose={() => {}}
        className="flex items-center justify-center"
      >
        <Box className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 outline-none text-center">
          <div className="w-40 h-40 mx-auto mb-4">
            <img src="/images/challenge.gif" alt="Challenge completed" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-[#64aa86] mb-3">
            Good job!
          </h2>
          <p className="text-gray-700 mb-6">
            You completed today's daily challenge. Come back again tomorrow!
          </p>
          <button
            onClick={handleFinishClick}
            className="px-8 py-3 bg-[#64aa86] text-white text-lg font-medium rounded-lg hover:bg-[#4e8067] transition-colors duration-300"
          >
            Finish
          </button>
        </Box>
      </Modal>

      {/* Warning modal */}
      <Modal open={showWarningModal} onClose={handleWarningModalClose}>
        <Box className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-20">
          <h2 className="text-xl font-bold mb-4">You are not alone</h2>
          <p className="mb-4">
            It looks like your journal entry contains words that may indicate you are feeling down. 
            Please remember that you are not alone. Speak to trusted friends or family members and seek professional help if you can.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleWarningModalClose}
              className="bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleWarningModalProceed}
              className="bg-[#64aa86] text-white font-bold py-2 px-4 rounded"
            >
              Proceed
            </button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default JournalEntry;