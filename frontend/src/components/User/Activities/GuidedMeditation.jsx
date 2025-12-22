import React, { useState } from 'react';
import { FaLeaf, FaSpa, FaEye, FaMusic, FaDotCircle } from 'react-icons/fa';

const meditationData = {
  mindfulness: {
    '5': 'ssss7V1_eyA',
    '10': 'Evgx9yX2Vw8',
  },
  'body-scan': {
    '5': 'z8zX-QbXIT4',
    '10': 'nnVCadMo3qI',
  },
  visualization: {
    '5': '_YAgCAhVtss',
    '10': 'Tvs7JNV8NDA', 
  },
  sound: {
    '5': '1AQs9vLcr3Q',
    '10': 'YlOUww60Q5M',
  },
  chakra: {
    '5': 'v0r2zCMcRsA', 
    '10': 'P_ri2uy9Hgs',
  },
};

const meditationTypes = [
  { id: 'mindfulness', name: 'Mindfulness', icon: <FaLeaf /> },
  { id: 'body-scan', name: 'Body Scan', icon: <FaSpa /> },
  { id: 'visualization', name: 'Visualization', icon: <FaEye /> },
  { id: 'sound', name: 'Sound Bath', icon: <FaMusic /> },
  { id: 'chakra', name: 'Chakra', icon: <FaDotCircle /> },
];

const GuidedMeditation = () => {
  const [meditationType, setMeditationType] = useState('mindfulness');
  const [duration, setDuration] = useState('5');
  const [video, setVideo] = useState(meditationData.mindfulness['5']);

  const handleMeditationTypeChange = (type) => {
    setMeditationType(type);
    setVideo(meditationData[type][duration]);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setVideo(meditationData[meditationType][newDuration]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Guided Meditation</h1>
          <p className="text-lg text-gray-400 mt-2">Find your inner peace and calm.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Meditation selection */}
          <div className="lg:col-span-1 bg-gray-800 bg-opacity-50 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Choose Your Path</h2>
            <div className="space-y-2">
              {meditationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleMeditationTypeChange(type.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-300 flex items-center space-x-3 ${
                    meditationType === type.id
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span>{type.name}</span>
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Select Duration</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => handleDurationChange('5')}
                className={`w-full p-3 rounded-lg transition-all duration-300 ${
                  duration === '5' ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                5 Minutes
              </button>
              <button
                onClick={() => handleDurationChange('10')}
                className={`w-full p-3 rounded-lg transition-all duration-300 ${
                  duration === '10' ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                10 Minutes
              </button>
            </div>
          </div>

          {/* Right side: Video player */}
          <div className="lg:col-span-2 bg-gray-800 bg-opacity-50 rounded-lg p-4 shadow-lg flex flex-col">
            <div className="aspect-video w-full">
              {video ? (
                <iframe
                  className="rounded-lg w-full h-full"
                  src={`https://www.youtube.com/embed/${video}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-700 rounded-lg">
                  <p>Please select a meditation type and duration.</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
                <h3 className="text-2xl font-semibold capitalize">{meditationType.replace('-', ' ')} Meditation</h3>
                <p className="text-gray-400">{duration} minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedMeditation;
