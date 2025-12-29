import React, { useState } from 'react';
import { FaLeaf, FaSpa, FaEye, FaMusic, FaDotCircle } from 'react-icons/fa';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const meditationData = {
  mindfulness: {
    '5': {
      id: 'ssss7V1_eyA',
      description: 'A gentle 5-minute mindfulness meditation to help you become present and aware of your thoughts and sensations.',
    },
    '10': {
      id: 'Evgx9yX2Vw8',
      description: 'A 10-minute guided mindfulness session to cultivate calm and clarity by focusing on the breath and present moment.',
    },
  },
  'body-scan': {
    '5': {
      id: 'z8zX-QbXIT4',
      description: 'A short body scan to help you relax and connect with your body, releasing tension from head to toe.',
    },
    '10': {
      id: 'nnVCadMo3qI',
      description: 'A deeper 10-minute body scan meditation for full-body relaxation and stress relief.',
    },
  },
  visualization: {
    '5': {
      id: '_YAgCAhVtss',
      description: 'A quick visualization to help you imagine a peaceful place and boost your mood.',
    },
    '10': {
      id: 'Tvs7JNV8NDA',
      description: 'A 10-minute visualization journey to inspire positivity and inner peace.',
    },
  },
  sound: {
    '5': {
      id: '1AQs9vLcr3Q',
      description: 'A 5-minute sound bath using soothing tones to calm your mind and body.',
    },
    '10': {
      id: 'YlOUww60Q5M',
      description: 'A longer sound bath experience for deep relaxation and mental clarity.',
    },
  },
  chakra: {
    '5': {
      id: 'v0r2zCMcRsA',
      description: 'A brief chakra meditation to balance your energy centers and promote well-being.',
    },
    '10': {
      id: 'P_ri2uy9Hgs',
      description: 'A 10-minute chakra alignment meditation for harmony and inner balance.',
    },
  },
};

const meditationTypes = [
  { id: 'mindfulness', name: 'Mindfulness', icon: <FaLeaf /> },
  { id: 'body-scan', name: 'Body Scan', icon: <FaSpa /> },
  { id: 'visualization', name: 'Visualization', icon: <FaEye /> },
  { id: 'sound', name: 'Sound Bath', icon: <FaMusic /> },
  { id: 'chakra', name: 'Chakra', icon: <FaDotCircle /> },
];

const GuidedMeditation = ({ onBack }) => {
  const [meditationType, setMeditationType] = useState('mindfulness');
  const [duration, setDuration] = useState('5');

  const currentMeditation = meditationData[meditationType][duration];

  // UI improvement: add header, back button, and more modern layout/colors
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f7fa] via-[#f1f8e8] to-[#eaf7f3] text-[#1b5f52] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#CBE7DC] py-4 px-4 flex items-center shadow-sm">
        <button
          onClick={onBack ? onBack : () => window.history.back()}
          className="p-2 rounded-full hover:bg-[#E6F4EA] transition"
          aria-label="Back"
        >
          <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 28 }} />
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold tracking-tight text-[#1b5f52]">
          Guided Meditation
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side: Meditation selection */}
          <div className="lg:col-span-1 bg-white/90 rounded-2xl p-6 shadow-lg border-2 border-[#E6F4EA]">
            <h2 className="text-xl font-semibold mb-4 text-[#40916c]">Choose Your Path</h2>
            <div className="space-y-2">
              {meditationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMeditationType(type.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center space-x-3 border-2 ${
                    meditationType === type.id
                      ? 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white border-[#55AD9B] shadow-md'
                      : 'bg-[#F7FBF9] hover:bg-[#EAF7F3] text-[#1b5f52] border-[#E6F4EA]'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-semibold">{type.name}</span>
                </button>
              ))}
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4 text-[#40916c]">Select Duration</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setDuration('5')}
                className={`flex-1 p-3 rounded-xl font-semibold transition-all duration-300 border-2 ${
                  duration === '5'
                    ? 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white border-[#55AD9B]'
                    : 'bg-[#F7FBF9] hover:bg-[#EAF7F3] text-[#1b5f52] border-[#E6F4EA]'
                }`}
              >
                5 Minutes
              </button>
              <button
                onClick={() => setDuration('10')}
                className={`flex-1 p-3 rounded-xl font-semibold transition-all duration-300 border-2 ${
                  duration === '10'
                    ? 'bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white border-[#55AD9B]'
                    : 'bg-[#F7FBF9] hover:bg-[#EAF7F3] text-[#1b5f52] border-[#E6F4EA]'
                }`}
              >
                10 Minutes
              </button>
            </div>
          </div>

          {/* Right side: Video player and description */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white/90 rounded-2xl p-4 shadow-lg border-2 border-[#E6F4EA] flex flex-col items-center">
              <div className="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-[#F7FBF9] border border-[#E6F4EA]">
                {currentMeditation ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentMeditation.id}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full bg-[#EAF7F3]">
                    <p className="text-[#40916c]">Please select a meditation type and duration.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-bold capitalize text-[#1b5f52]">
                  {meditationType.replace('-', ' ')} Meditation
                </h3>
                <p className="text-[#40916c] font-medium">{duration} minutes</p>
              </div>
            </div>
            {/* Description Box */}
            <div className="flex items-start gap-3 bg-[#E6F4EA]/60 border border-[#CBE7DC] rounded-xl p-5 min-h-[64px]">
              <InfoOutlinedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
              <span className="text-[#1b5f52] text-base font-medium leading-relaxed">
                {currentMeditation
                  ? currentMeditation.description
                  : 'Choose a meditation type and duration to see an overview.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedMeditation;