import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../../BottomNav';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

// Recommendations based on challenge type
const challengeRecommendations = {
  "Gratitude Challenge": [
    "Start a dedicated gratitude journal to write down three things you're grateful for each day",
    "Practice mindful gratitude by pausing to appreciate simple everyday moments",
    "Express your appreciation to others more often through words, notes, or small gestures",
    "Take photos of things you're grateful for to create a visual gratitude collection",
    "Try a gratitude meditation focusing on people and experiences you appreciate"
  ],
  "Self-Love Challenge": [
    "Create a self-care routine that includes activities you genuinely enjoy",
    "Practice positive self-talk and challenge your inner critic",
    "Set healthy boundaries in relationships to honor your needs and values",
    "Celebrate your accomplishments, no matter how small they may seem",
    "Forgive yourself for past mistakes and focus on growth instead of perfection"
  ],
  "Achievement Challenge": [
    "Break larger goals into smaller, manageable steps to track your progress",
    "Create a vision board that visually represents your goals and aspirations",
    "Share your goals with trusted friends who can provide support and accountability",
    "Reflect on past successes when facing new challenges to boost confidence",
    "Celebrate your progress along the way, not just the final achievement"
  ],
  "Kindness Challenge": [
    "Set a goal to perform one random act of kindness each day",
    "Look for opportunities to help others without expecting anything in return",
    "Practice active listening to better understand others' needs and feelings",
    "Join a volunteer organization that aligns with your values and interests",
    "Extend kindness to yourself as well - self-compassion is equally important"
  ],
  "Hobby Challenge": [
    "Schedule dedicated time in your calendar for your hobbies to ensure regular practice",
    "Join communities or groups related to your interests to learn and stay motivated",
    "Challenge yourself to learn new techniques or aspects of your hobby",
    "Share your hobby with friends or family to enhance the experience",
    "Try combining different hobbies for creative cross-pollination"
  ],
  "Relaxation Challenge": [
    "Create a calming environment in your home with comfortable spaces and minimal distractions",
    "Experiment with different relaxation techniques to find what works best for you",
    "Set boundaries around technology use to reduce stress from constant connectivity",
    "Incorporate short relaxation breaks throughout your day, not just at the end",
    "Make quality sleep a priority by establishing a consistent bedtime routine"
  ],
  "Reflection Challenge": [
    "Use journaling prompts to deepen your self-reflection practice",
    "Schedule a weekly review session to assess what you've learned and plan ahead",
    "Practice mindfulness meditation to develop greater self-awareness",
    "Seek feedback from trusted others to gain different perspectives on your growth",
    "Connect your reflections to actionable changes in your daily habits"
  ]
};

// Default recommendations if challenge type is not found
const defaultRecommendations = [
  "Practice daily journaling to track your thoughts and emotions",
  "Try meditation to improve mindfulness and reduce stress",
  "Take short walks in nature to clear your mind",
  "Connect with friends and loved ones regularly",
  "Set small, achievable goals to build confidence and momentum"
];

const ViewJournal = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [challengeData, setChallengeData] = useState({});
  const [journalDate, setJournalDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchJournalEntry = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/journal/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setImages(response.data.images || []);
        setChallenge(response.data.challenge);
        setChallengeData(response.data.challengeData || {});
        setJournalDate(new Date(response.data.date));
      } catch (error) {
        console.error('Error fetching journal entry:', error);
        toast.error('Failed to load journal entry.');
      } finally {
        setLoading(false);
      }
    };

    fetchJournalEntry();
  }, [id]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleBackClick = () => {
    navigate('/journal-logs');
  };

  const handleRecommendationsClick = () => {
    setShowRecommendations(true);
  };

  const handleCloseRecommendations = () => {
    setShowRecommendations(false);
  };

  // Get recommendations based on challenge type
  const getRecommendations = () => {
    if (challenge && challengeRecommendations[challenge.title]) {
      return challengeRecommendations[challenge.title];
    }
    return defaultRecommendations;
  };

  // Format the journal date nicely if available
  const formattedJournalDate = journalDate ? journalDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Loading...';

  // Check if there are any fields with data
  const hasEntryData = Object.values(challengeData).some(value => value && value.trim() !== '');

  return (
    <div className="bg-[#b4ddc8] min-h-screen flex flex-col">
      {/* Header */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white py-4 shadow-md sticky top-0 z-10"
      >
        <div className="container mx-auto flex items-center px-4 relative">
          <div className="absolute left-4">
            <ArrowBackIcon 
              className="cursor-pointer text-[#64aa86]" 
              onClick={handleBackClick} 
            />
          </div>
          
          {/* Centered date with calendar.gif */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center">
              <img 
                src="/images/calendar.gif" 
                alt="Calendar" 
                className="w-7 h-7 mr-2"
              />
              <span className="font-medium text-gray-700">{formattedJournalDate}</span>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto pb-16 px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#64aa86]"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Challenge card */}
            {challenge && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden mb-6"
              >
                <div className="bg-[#64aa86] text-white px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{challenge.title}</h2>
                    <p className="mt-1 opacity-90">{challenge.description}</p>
                  </div>
                  
                  {/* Added idea.gif button */}
                  <div 
                    className="cursor-pointer flex-shrink-0 ml-4"
                    onClick={handleRecommendationsClick}
                  >
                    <img 
                      src="/images/idea.gif" 
                      alt="Ideas" 
                      className="w-9 h-9"
                      title="Get recommendations" 
                    />
                  </div>
                </div>
                
                <div className="p-6">
                  {challenge.fields.map((field, index) => {
                    const entryValue = challengeData[field.state] || '';
                    const isEmpty = !entryValue.trim();
                    
                    return (
                      <div key={field.state} className="mb-6 last:mb-0">
                        <label className="block text-base font-medium text-gray-700 mb-2">
                          {field.placeholder}
                        </label>
                        <div className={`bg-gray-50 rounded-lg p-4 text-base ${isEmpty ? 'italic text-gray-400' : 'text-gray-800 font-medium'}`}>
                          {isEmpty ? 'No content added' : entryValue}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Images section */}
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg shadow-lg p-6 mb-6"
              >
                <div className="flex items-center mb-4">
                  <PhotoLibraryIcon className="mr-2 text-[#64aa86]" />
                  <h3 className="text-lg font-medium text-gray-800">Photos</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      className="aspect-square relative rounded-lg overflow-hidden shadow-md"
                    >
                      <img
                        src={image}
                        alt={`Journal image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleImageClick(image)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {!hasEntryData && images.length === 0 && (
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <div className="text-[#64aa86] text-5xl mb-4">😕</div>
                <h3 className="text-xl font-medium mb-2">This journal entry appears empty</h3>
                <p className="text-gray-500">There's no content or images in this entry.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value="journal" setValue={() => {}} />
      </div>

      {/* Image preview modal */}
      <Modal 
        open={!!selectedImage} 
        onClose={handleCloseModal}
        className="flex items-center justify-center"
      >
        <Box className="relative outline-none max-w-[90vw] max-h-[90vh]">
          <img 
            src={selectedImage} 
            alt="Selected" 
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl bg-white p-2"
          />
          <div 
            className="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-full cursor-pointer hover:bg-opacity-70 transition-colors duration-200"
            onClick={handleCloseModal}
          >
            <CloseIcon className="text-white" />
          </div>
        </Box>
      </Modal>

      {/* Recommendations modal */}
      <Modal
        open={showRecommendations}
        onClose={handleCloseRecommendations}
        className="flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 outline-none relative">
            <div 
              className="absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
              onClick={handleCloseRecommendations}
            >
              <CloseIcon />
            </div>
            
            <div className="mb-6 flex items-center">
              <img 
                src="/images/idea.gif" 
                alt="Ideas" 
                className="w-10 h-10 mr-3" 
              />
              <h2 className="text-xl font-bold text-[#64aa86]">
                Ideas to Improve Your {challenge?.title || 'Practice'}
              </h2>
            </div>
            
            <div className="space-y-3">
              {getRecommendations().map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-[#e9f5ef] rounded-lg p-4 border-l-4 border-[#64aa86]"
                >
                  <p className="text-gray-700">{recommendation}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={handleCloseRecommendations}
                className="px-5 py-2 bg-[#64aa86] text-white rounded-lg hover:bg-[#4e8067] transition-colors duration-300"
              >
                Got it!
              </button>
            </div>
          </Box>
        </motion.div>
      </Modal>
    </div>
  );
};

export default ViewJournal;