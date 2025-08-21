import React, { useState, useEffect, useRef } from 'react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const affirmingQuotes = [
  "Believe in yourself! You have the power to achieve great things.",
  "You can do it! Keep pushing forward and never give up.",
  "Stay positive! Every day is a new opportunity to grow.",
  "Keep going! Your hard work will pay off in the end.",
  "You are amazing! Embrace your uniqueness and shine bright.",
  "You are capable of overcoming any challenge that comes your way.",
  "Your potential is limitless. Keep striving for your goals.",
  "Every small step forward is progress. Be proud of yourself.",
  "Trust your journey, even when the path isn't clear.",
  "Your strength is greater than any struggle you face.",
  "I am worthy of love, respect, and positive energy.",
  "My thoughts and feelings are valid. I honor them with compassion.",
  "I create my own happiness by accepting who I am.",
  "Today I choose confidence over doubt and courage over fear.",
  "I release all negative thoughts and embrace positivity.",
  "I am becoming the best version of myself one step at a time.",
  "My challenges help me grow stronger and wiser each day.",
  "I transform obstacles into opportunities for growth.",
  "I celebrate my unique qualities and gifts.",
  "My persistence will lead me to success."
];

const Affirmation = () => {
  const [currentQuote, setCurrentQuote] = useState('');
  const [completedQuotes, setCompletedQuotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [voices, setVoices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [characters, setCharacters] = useState([]);
  const containerRef = useRef(null);

  // Initialize quote and characters
  useEffect(() => {
    const randomQuote = getRandomQuote();
    setCurrentQuote(randomQuote);
    setCharacters(randomQuote.split(''));

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Focus container when it's available
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [containerRef]);

  const getRandomQuote = () => {
    // Get a different quote than current one
    let randomQuote;
    do {
      randomQuote = affirmingQuotes[Math.floor(Math.random() * affirmingQuotes.length)];
    } while (randomQuote === currentQuote);
    return randomQuote;
  };

  const handleKeyDown = (e) => {
    // Skip if all characters are typed
    if (currentIndex >= characters.length) return;

    if (e.key === characters[currentIndex]) {
      setCurrentIndex(currentIndex + 1);
      
      // Check if completed
      if (currentIndex === characters.length - 1) {
        completeQuote();
      }
    } else if (e.key === 'Backspace' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    // Prevent default to avoid scrolling
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const completeQuote = () => {
    // Add to completed quotes
    setCompletedQuotes([...completedQuotes, currentQuote]);
    
    // Don't automatically reset - wait for user to click the new quote button
    // Just indicate that the quote is finished
    
    // Speak the completed quote
    handleTextToSpeech(currentQuote);
  };
  
  const getNewQuote = () => {
    // Add current quote to completed list if it's started but not completed
    if (currentIndex > 0 && currentIndex < characters.length) {
      setCompletedQuotes([...completedQuotes, currentQuote + " (incomplete)"]);
    }
    
    const newQuote = getRandomQuote();
    setCurrentQuote(newQuote);
    setCharacters(newQuote.split(''));
    setCurrentIndex(0);
    
    // Ensure container has focus after getting a new quote
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  const handleTextToSpeech = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a natural sounding female voice
    const preferredVoices = [
      "Google UK English Female", 
      "Microsoft Zira", 
      "Samantha",
      "Female"
    ];
    
    let selectedVoice = null;
    
    for (const preferredVoice of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferredVoice));
      if (voice) {
        selectedVoice = voice;
        break;
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Improve naturalness
    utterance.rate = 0.95; // Slightly slower than default
    utterance.pitch = 1.05; // Slightly higher pitch
    
    window.speechSynthesis.speak(utterance);
  };

  // Function to format long quotes with line breaks
  const formatTextWithBreaks = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length > maxLength) {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    
    if (currentLine) lines.push(currentLine);
    
    return lines.join('\n');
  };

  const renderCharacters = () => {
    // Insert line breaks for long quotes
    let charIndex = 0;
    const formattedCharacters = [];
    const maxLineLength = 40; // Adjust based on container width
    let currentLineLength = 0;
    
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      
      // Add a line break if the line is getting too long and we're at a space
      if (currentLineLength > maxLineLength && char === ' ') {
        formattedCharacters.push(<br key={`br-${i}`} />);
        currentLineLength = 0;
        continue; // Skip the space after adding a break
      }
      
      // Add the character with proper styling
      let className = "text-2xl ";
      if (i < currentIndex) {
        className += "text-green-400"; // Completed characters
      } else if (i === currentIndex) {
        className += "text-yellow-300 border-b-2 border-yellow-300 animate-pulse"; // Current character
      } else {
        className += "text-white text-opacity-90"; // Future characters
      }
      
      // Handle spaces specially
      if (char === ' ') {
        formattedCharacters.push(<span key={i} className={className}>&nbsp;</span>);
      } else {
        formattedCharacters.push(<span key={i} className={className}>{char}</span>);
      }
      
      currentLineLength++;
    }
    
    return formattedCharacters;
  };

  return (
    <div className="bg-gradient-to-r from-[#3a7b7d] via-[#61c3c6] to-[#89d2d5] min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-6">
      <div className="absolute top-6 left-6">
        <HelpOutlineIcon 
          className="text-white hover:text-yellow-200 transition-colors"
          style={{ fontSize: 30, cursor: 'pointer' }} 
          onClick={() => setShowModal(true)} 
        />
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          aria-labelledby="affirmation-modal-title"
          aria-describedby="affirmation-modal-description"
        >
          <Box 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl"
            style={{ maxWidth: '450px', width: '90%' }}
          >
            <Typography variant="h5" component="h2" className="mb-4 font-bold text-[#3a7b7d]">
              What is Affirmation Typing?
            </Typography>
            <Typography className="text-gray-700">
              The Affirmation Typing exercise helps you internalize positive statements by typing them out.
              <br/><br/>
              <strong>How it works:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li>Simply start typing the displayed affirmation character by character</li>
                <li>Current character position is highlighted</li>
                <li>When you complete an affirmation, it will be read aloud</li>
                <li>Use the refresh button if you want a new affirmation</li>
                <li>Click the speaker icon to hear any completed affirmation again</li>
              </ul>
              <br/>
              This practice combines visual, tactile, and auditory learning to help positive affirmations stick in your mind.
            </Typography>
            <button 
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-[#61c3c6] text-white rounded-lg hover:bg-[#3a7b7d] transition-colors"
            >
              Got it
            </button>
          </Box>
        </Modal>
      </div>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Affirmation Typing</h1>
        <p className="text-white text-opacity-80 mb-2">Type the affirmation to internalize its message</p>
        <p className="text-white text-opacity-70 text-sm">Just start typing - no need to click anywhere</p>
      </div>
      
      <div 
        ref={containerRef}
        tabIndex="0"
        onKeyDown={handleKeyDown}
        className="w-full max-w-3xl bg-[#2a5a5c] p-8 rounded-xl shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-50"
      >
        <div className="relative">
          <div className="absolute top-0 right-0 mt-[-10] mr-2">
            <RefreshIcon 
              className="text-white text-opacity-60 hover:text-yellow-200 transition-colors cursor-pointer"
              onClick={getNewQuote}
              title="Get a new affirmation"
            />
          </div>
          
          <div className="text-center leading-relaxed tracking-wider my-10 min-h-[80px]">
            {renderCharacters()}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          {currentIndex === characters.length ? (
            <div className="flex justify-center items-center space-x-2">
              <p className="text-green-400 font-medium">Well done! Click to get a new affirmation</p>
              <AutorenewIcon 
                className="text-green-400 hover:text-yellow-300 transition-colors cursor-pointer"
                onClick={getNewQuote}
              />
            </div>
          ) : (
            <p className="text-yellow-200">
              {`${currentIndex}/${characters.length} characters`}
            </p>
          )}
        </div>
      </div>
      
      <div className="w-full max-w-3xl mt-10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          Your Completed Affirmations
          <span className="ml-2 bg-green-400 text-gray-900 text-sm font-semibold px-2 py-1 rounded-full">
            {completedQuotes.length}
          </span>
        </h2>
        {completedQuotes.length === 0 ? (
          <div className="bg-white bg-opacity-10 p-6 rounded-xl text-center text-white">
            Completed affirmations will appear here
          </div>
        ) : (
          <div className="space-y-3">
            {completedQuotes.map((quote, index) => (
              <div key={index} className="flex items-center bg-white bg-opacity-15 p-4 rounded-xl">
                <CheckCircleIcon className="text-green-400 mr-3 flex-shrink-0" />
                <p className="text-lg text-white flex-grow whitespace-pre-line">
                  {formatTextWithBreaks(quote)}
                </p>
                <VolumeUpIcon 
                  className="text-yellow-200 ml-3 hover:text-yellow-400 transition-colors cursor-pointer flex-shrink-0"
                  onClick={() => handleTextToSpeech(quote)} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Affirmation;