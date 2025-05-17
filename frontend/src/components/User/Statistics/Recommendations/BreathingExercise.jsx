import React, { useEffect, useState, useRef } from 'react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

const BreathingExercise = () => {
  // Breathing technique configurations
  const breathingTechniques = [
    {
      id: 'box',
      name: 'Box Breathing',
      description: 'Navy SEAL technique for stress reduction',
      phases: ['Breathe In', 'Hold', 'Breathe Out', 'Hold'],
      durations: [4, 4, 4, 4],
      color: '#64aa86'
    },
    {
      id: '478',
      name: '4-7-8 Breathing',
      description: 'Promotes better sleep and reduces anxiety',
      phases: ['Inhale', 'Hold', 'Exhale'],
      durations: [4, 7, 8],
      color: '#5a9edb'
    },
    {
      id: 'diaphragmatic',
      name: 'Diaphragmatic Breathing',
      description: 'Strengthens the diaphragm and reduces stress',
      phases: ['Inhale', 'Exhale'],
      durations: [4, 6],
      color: '#9c75d5'
    }
  ];

  // State variables
  const [selectedTechnique, setSelectedTechnique] = useState(breathingTechniques[0]);
  const [phase, setPhase] = useState('Breathe In');
  const [count, setCount] = useState(4);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTechniqueInfo, setShowTechniqueInfo] = useState(false);
  
  // References
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Effect for handling breathing exercise timing (unified approach for all techniques)
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isPaused) {
      // Set up interval with consistent logic for all techniques
      intervalRef.current = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount === 1) {
            // Calculate next phase and update all states
            const nextIndex = (currentPhaseIndex + 1) % selectedTechnique.phases.length;
            setCurrentPhaseIndex(nextIndex);
            setPhase(selectedTechnique.phases[nextIndex]);
            return selectedTechnique.durations[nextIndex];
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedTechnique, currentPhaseIndex, isPaused]);

  // Initialize audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.5;
      if (!isMuted && !isPaused) {
        audioRef.current.play().catch(err => console.log("Audio play prevented:", err));
      }
    }
  }, []);

  // Handle technique change
  const changeTechnique = (technique) => {
    setSelectedTechnique(technique);
    
    // Reset to first phase and appropriate count
    setCurrentPhaseIndex(0);
    setPhase(technique.phases[0]);
    setCount(technique.durations[0]);
    setIsPaused(false);
  };

  // Volume adjustment
  const adjustVolume = (event) => {
    if (audioRef.current) {
      const volume = event.target.value;
      audioRef.current.volume = volume;
      setIsMuted(volume === '0');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      audioRef.current.volume = newMuteState ? 0 : 0.5;
      
      if (!newMuteState && !isPaused) {
        audioRef.current.play().catch(err => console.log("Audio play prevented:", err));
      }
    }
  };

  // Toggle pause
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(err => console.log("Audio play prevented:", err));
      }
    } else {
      setIsPaused(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  // Render the breathing visualization based on selected technique
  const renderBreathingVisualization = () => {
    const techniqueColor = selectedTechnique.color;
    
    // Box Breathing Visualization
    if (selectedTechnique.id === 'box') {
      // Fixed the position mapping to match current phase index correctly
      // Using a more direct mapping to ensure dot position matches the current phase
      let dotPosition = { top: '50%', left: '50%' };
      
      switch(currentPhaseIndex) {
        case 0: // Breathe In - left side
          dotPosition = { top: '50%', left: '0' };
          break;
        case 1: // First Hold - top
          dotPosition = { top: '0', left: '50%' };
          break;
        case 2: // Breathe Out - right side
          dotPosition = { top: '50%', left: '100%' };
          break;
        case 3: // Second Hold - bottom
          dotPosition = { top: '100%', left: '50%' };
          break;
        default:
          dotPosition = { top: '50%', left: '0' };
      }

      return (
        <div className="w-full max-w-md h-64 relative">
          <div className="w-64 h-64 mx-auto border-4 rounded-xl relative flex items-center justify-center"
               style={{ borderColor: techniqueColor }}>
            {/* Phase indicators */}
            <p className={`absolute top-2 text-lg ${currentPhaseIndex === 0 ? 'font-bold' : ''}`}
               style={{ color: currentPhaseIndex === 0 ? techniqueColor : '#b1b1b1' }}>
              Breathe In
            </p>
            <p className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-lg ${currentPhaseIndex === 1 ? 'font-bold' : ''}`}
               style={{ color: currentPhaseIndex === 1 ? techniqueColor : '#b1b1b1' }}>
              Hold
            </p>
            <p className={`absolute bottom-2 text-lg ${currentPhaseIndex === 2 ? 'font-bold' : ''}`}
               style={{ color: currentPhaseIndex === 2 ? techniqueColor : '#b1b1b1' }}>
              Breathe Out
            </p>
            <p className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-lg ${currentPhaseIndex === 3 ? 'font-bold' : ''}`}
               style={{ color: currentPhaseIndex === 3 ? techniqueColor : '#b1b1b1' }}>
              Hold
            </p>

     {/* Animated indicator for current position */}
<div className={`absolute w-4 h-4 rounded-full transition-all duration-700 shadow-lg`}
     style={{ 
       backgroundColor: techniqueColor,
       top: currentPhaseIndex === 0 ? '0%' : 
            currentPhaseIndex === 1 ? '50%' :
            currentPhaseIndex === 2 ? '100%' : '50%',
       left: currentPhaseIndex === 0 ? '50%' : 
             currentPhaseIndex === 1 ? '100%' :
             currentPhaseIndex === 2 ? '50%' : '0%',
       transform: 'translate(-50%, -50%)'
     }}>
</div>
              
            {/* Counter - showing only the number */}
            <div className="bg-white bg-opacity-90 px-6 py-4 rounded-full shadow-md">
              <p className="text-5xl font-bold" style={{ color: techniqueColor }}>{count}</p>
            </div>
          </div>
        </div>
      );
    }
    
    // 4-7-8 Breathing Visualization
    else if (selectedTechnique.id === '478') {
      // Calculate progress percentage
      const currentDuration = selectedTechnique.durations[currentPhaseIndex];
      const progress = ((currentDuration - count) / currentDuration) * 100;
      
      // Determine position for the current phase
      const getPhasePosition = () => {
        if (currentPhaseIndex === 0) return "bottom"; // Inhale at bottom
        if (currentPhaseIndex === 1) return "middle"; // Hold in middle
        return "top"; // Exhale at top
      };
      
      const position = getPhasePosition();
      
      return (
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Phase indicator */}
          <div className="mb-8 flex space-x-4 items-center">
            {selectedTechnique.phases.map((p, i) => (
              <div key={p} className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full ${i === currentPhaseIndex ? 'bg-opacity-100' : 'bg-opacity-30'}`}
                       style={{ backgroundColor: techniqueColor }}></div>
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium" 
                   style={{ color: i === currentPhaseIndex ? techniqueColor : '#b1b1b1' }}>
                  {p}
                </p>
                <p className="text-xs text-gray-400">{selectedTechnique.durations[i]}s</p>
              </div>
            ))}
          </div>
          
          {/* Visual progress */}
          <div className="w-64 h-64 relative flex items-center justify-center">
            {/* Vertical line to show the 3 positions */}
            <div className="absolute h-3/4 w-0.5 left-1/2 transform -translate-x-1/2 bg-gray-200"></div>
            
            {/* Position indicators */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full"
                 style={{ 
                   backgroundColor: position === "top" ? techniqueColor : `${techniqueColor}33`
                 }}>
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                 style={{ 
                   backgroundColor: position === "middle" ? techniqueColor : `${techniqueColor}33`
                 }}>
            </div>
            
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full"
                 style={{ 
                   backgroundColor: position === "bottom" ? techniqueColor : `${techniqueColor}33`
                 }}>
            </div>
            
            {/* Current position indicator */}
            <div className="absolute w-6 h-6 left-1/2 transform -translate-x-1/2 rounded-full shadow-md"
                 style={{ 
                   backgroundColor: techniqueColor,
                   top: position === "top" ? "0" :
                         position === "middle" ? "50%" : "100%",
                   transform: position === "middle" ? 'translate(-50%, -50%)' : 'translateX(-50%)'
                 }}>
            </div>
            
            {/* Progress ring */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none"
                strokeWidth="4"
                stroke={`${techniqueColor}33`}
              />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none"
                strokeWidth="4"
                stroke={techniqueColor}
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress / 100)}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            
            {/* Counter */}
            <div className="absolute bg-white bg-opacity-90 px-6 py-4 rounded-full shadow-md">
              <div className="flex flex-col items-center">
                <p className="text-4xl font-bold" style={{ color: techniqueColor }}>{count}</p>
                <p className="text-lg" style={{ color: techniqueColor }}>{phase}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Diaphragmatic Breathing Visualization
    else if (selectedTechnique.id === 'diaphragmatic') {
      // Calculate size for animation effect (grows during inhale, shrinks during exhale)
      const currentDuration = selectedTechnique.durations[currentPhaseIndex];
      const progress = ((currentDuration - count) / currentDuration);
      const size = currentPhaseIndex === 0
        ? 50 + (progress * 50) // Inhale: grow from 50% to 100%
        : 100 - (progress * 50); // Exhale: shrink from 100% to 50%
      
      return (
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Phase indicator */}
          <div className="mb-8 flex space-x-12 items-center">
            {selectedTechnique.phases.map((p, i) => (
              <div key={p} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                ${i === currentPhaseIndex ? 'bg-opacity-100' : 'bg-opacity-30'}`}
                     style={{ backgroundColor: techniqueColor }}>
                  <span className="text-white">
                    {i === 0 ? '↓' : '↑'}
                  </span>
                </div>
                <p className="mt-2 font-medium" 
                   style={{ color: i === currentPhaseIndex ? techniqueColor : '#b1b1b1' }}>
                  {p}
                </p>
                <p className="text-xs text-gray-400">{selectedTechnique.durations[i]}s</p>
              </div>
            ))}
          </div>
          
          {/* Sequence arrows */}
          <div className="mb-4 relative w-32">
            <div className="w-32 h-0.5 bg-gray-200"></div>
            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-gray-200 transform rotate-45"></div>
            {currentPhaseIndex === 1 && (
              <div className="absolute -bottom-6 left-0 text-xs text-gray-500">Repeating sequence</div>
            )}
          </div>
          
          {/* Visual representation */}
          <div className="w-64 h-64 relative flex items-center justify-center">
            <div className="absolute w-full h-full flex items-center justify-center">
              <div className="rounded-full transition-all duration-500"
                   style={{ 
                     width: `${size}%`, 
                     height: `${size}%`, 
                     backgroundColor: `${techniqueColor}22`,
                     border: `3px solid ${techniqueColor}`
                   }}>
              </div>
            </div>
            
            {/* Counter */}
            <div className="z-10 bg-white bg-opacity-90 px-6 py-4 rounded-full shadow-md">
              <div className="flex flex-col items-center">
                <p className="text-4xl font-bold" style={{ color: techniqueColor }}>{count}</p>
                <p className="text-lg" style={{ color: techniqueColor }}>{phase}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#3c4f61] via-[#506c8a] to-[#87a0b8] min-h-screen flex flex-col items-center py-10 px-4 relative">
      {/* Help Button (Top Left) */}
      <button 
        onClick={() => setShowModal(true)} 
        className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-colors"
      >
        <HelpOutlineIcon style={{ color: 'white', fontSize: 20 }} />
      </button>

      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Breathing Exercises</h1>
        {/* Removed the InfoOutlinedIcon button here */}
      </div>
      
      {/* Exercise selector */}
      <div className="w-full max-w-4xl grid grid-cols-3 gap-3 mb-8">
        {breathingTechniques.map(technique => (
          <button 
            key={technique.id}
            onClick={() => changeTechnique(technique)}
            className={`p-3 rounded-lg transition-all duration-300 flex flex-col ${
              selectedTechnique.id === technique.id 
                ? 'bg-white shadow-lg transform scale-105' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-70'
            } relative`}
          >
            <h3 className="font-bold text-left" 
                style={{ color: selectedTechnique.id === technique.id ? technique.color : '#506c8a' }}>
              {technique.name}
            </h3>
            <div className="mt-1 h-1 w-12 rounded-full" 
                 style={{ backgroundColor: technique.color, opacity: selectedTechnique.id === technique.id ? 1 : 0.5 }} />
          </button>
        ))}
      </div>
      
      {/* Current exercise */}
      <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg mb-8 relative">
        {/* Info icon moved to bottom-left of main exercise container */}
        <InfoOutlinedIcon 
          onClick={() => setShowInfo(!showInfo)}
          style={{ 
            position: 'absolute', 
            bottom: '16px', 
            left: '16px', 
            fontSize: 22, 
            color: selectedTechnique.color,
            opacity: 0.7,
            cursor: 'pointer'
          }} 
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
          <div>
            <p className="text-[#b1b1b1] text-sm">Current Exercise</p>
            <h2 className="text-2xl font-bold" style={{ color: selectedTechnique.color }}>
              {selectedTechnique.name}
            </h2>
          </div>
          <div className="flex space-x-2 mt-3 sm:mt-0">
            <button 
              onClick={togglePause}
              className="px-4 py-1 rounded-full flex items-center"
              style={{ backgroundColor: selectedTechnique.color, color: 'white' }}
            >
              {isPaused ? <PlayArrowIcon fontSize="small" className="mr-1" /> : <PauseIcon fontSize="small" className="mr-1" />}
              {isPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>
        
        {/* Info panel */}
        {(showInfo || showTechniqueInfo) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-gray-600">
            <h3 className="font-bold mb-2">{selectedTechnique.name}</h3>
            <p className="mb-3">{selectedTechnique.description}</p>
            <div className="text-sm">
              <div className="font-medium mb-1">How to practice:</div>
              <ul className="list-disc pl-5">
                {selectedTechnique.id === 'box' && (
                  <>
                    <li>Inhale through your nose for 4 seconds</li>
                    <li>Hold your breath for 4 seconds</li>
                    <li>Exhale for 4 seconds</li>
                    <li>Hold your breath for 4 seconds</li>
                    <li>Repeat the cycle</li>
                  </>
                )}
                {selectedTechnique.id === '478' && (
                  <>
                    <li>Inhale through your nose for 4 seconds</li>
                    <li>Hold your breath for 7 seconds</li>
                    <li>Exhale through your mouth for 8 seconds</li>
                    <li>Repeat the cycle</li>
                  </>
                )}
                {selectedTechnique.id === 'diaphragmatic' && (
                  <>
                    <li>Place one hand on your chest and the other on your stomach</li>
                    <li>Inhale deeply through your nose for 4 seconds (stomach expands)</li>
                    <li>Exhale slowly through your mouth for 6 seconds</li>
                    <li>Repeat the cycle</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {/* Main breathing visualization */}
        <div className="flex justify-center items-center py-8">
          {renderBreathingVisualization()}
        </div>
      </div>
      
      {/* Audio controls */}
      <div className="w-full max-w-4xl bg-white bg-opacity-20 p-4 rounded-lg flex items-center">
        <button onClick={toggleMute} className="mr-3 text-white">
          {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          defaultValue={isMuted ? "0" : "0.5"}
          onChange={adjustVolume} 
          className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer"
          style={{ 
            accentColor: selectedTechnique.color
          }} 
        />
      </div>
      
      {/* Help Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        aria-labelledby="breathing-modal-title"
      >
        <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl w-11/12 max-w-lg">
          <h2 id="breathing-modal-title" className="text-2xl font-bold mb-4 text-[#3c4f61]">
            How to Use Breathing Exercises
          </h2>
          
          <div className="mb-4 text-gray-700">
            <p className="mb-3">
              Regular breathing exercises can help reduce stress, lower blood pressure, and improve focus. Choose any of the three techniques:
            </p>
            
            <ul className="list-disc pl-5 mb-3">
              <li className="mb-1"><strong>Box Breathing:</strong> Used by Navy SEALs to manage stress and improve concentration</li>
              <li className="mb-1"><strong>4-7-8 Breathing:</strong> Helps with anxiety, insomnia, and managing cravings</li>
              <li className="mb-1"><strong>Diaphragmatic Breathing:</strong> Strengthens the diaphragm and reduces oxygen demand</li>
            </ul>
            
            <p className="mb-3">
              For best results, practice for 3-5 minutes daily in a comfortable seated position.
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-[#3c4f61]">Controls:</h3>
            <ul className="list-disc pl-5 text-gray-700">
              <li className="mb-1">Select any breathing technique from the top menu</li>
              <li className="mb-1">Click on the info icon in the lower left corner for more information</li>
              <li className="mb-1">Follow the visual guide and countdown timer</li>
              <li className="mb-1">Use the Pause/Resume button to control the exercise</li>
              <li className="mb-1">Adjust or mute the background audio if needed</li>
            </ul>
          </div>
          
          <button 
            onClick={() => setShowModal(false)}
            className="mt-3 px-4 py-2 bg-[#506c8a] text-white rounded-md hover:bg-[#3c4f61] transition-colors"
          >
            Got it
          </button>
        </Box>
      </Modal>
      
      {/* Audio element */}
      <audio ref={audioRef} src="/music/breathingexercise.mp3" loop></audio>
    </div>
  );
};

export default BreathingExercise;