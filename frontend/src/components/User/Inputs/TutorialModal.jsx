import React, { useState } from 'react';

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Step 1: Choose a Category',
      description: 'Select what activity, social interaction, health activity, or sleep you want to log. Each category helps us understand different aspects of your wellbeing.',
      details: [
        'Activities: Academic or leisure activities you engaged in',
        'Social Interactions: Time spent with friends, family, or others',
        'Health-related Activities: Exercise, sports, or wellness activities',
        "Previous Night's Sleep: Hours of sleep you got"
      ]
    },
    {
      title: 'Step 2: Select Time',
      description: 'Tell us when this activity or event happened. You have two options:',
      details: [
        'Yes, I remember: Enter the exact specific time',
        "No, I don't: Choose a general time period (Morning, Afternoon, Evening, etc.)",
        'This helps us track when activities happen and how they affect your mood'
      ]
    },
    {
      title: 'Step 3: Select Activity Details',
      description: 'Choose the specific activity or interaction from the available options. This provides context for your mood tracking.',
      details: [
        'Activities: Study, Exam, Project, Gaming, etc.',
        'Social: Who you spent time with and what you did',
        'Health: Type of exercise or wellness activity',
        'Sleep: Enter the number of hours you slept'
      ]
    },
    {
      title: 'Step 4: Before - Valence (Emotion Type)',
      description: 'How did you feel BEFORE doing this activity? Choose the general type of emotion:',
      details: [
        'Positive: Happy, excited, pleased emotions',
        'Negative: Sad, anxious, frustrated emotions',
        "Can't remember: If you don't recall your feeling"
      ]
    },
    {
      title: 'Step 5: Before - Select Emotion',
      description: 'Pick the specific emotion that best describes how you felt BEFORE the activity:',
      details: [
        'Positive emotions: Calm, Excited, Happy, Pleased, Relaxed',
        'Negative emotions: Angry, Anxious, Bored, Frustrated, Sad',
        'Your selection helps create a detailed emotional snapshot'
      ]
    },
    {
      title: 'Step 6: Before - Rate Intensity & Reason',
      description: 'Rate how strongly you felt that emotion (1-5 scale) and explain why:',
      details: [
        '1 = Low intensity (barely felt it)',
        '5 = High intensity (very strong feeling)',
        'Reason: Briefly explain what caused this feeling (up to 100 words)',
        'Example: "I was nervous because it was my first exam"'
      ]
    },
    {
      title: 'Step 7: After - Valence (Emotion Type)',
      description: 'How did you feel AFTER completing this activity? Choose the general type of emotion:',
      details: [
        'Positive: Did the activity make you feel better?',
        'Negative: Did it leave you feeling worse?',
        'This shows how activities impact your emotional state'
      ]
    },
    {
      title: 'Step 8: After - Select Emotion',
      description: 'Pick the specific emotion that best describes how you felt AFTER the activity:',
      details: [
        'Your feeling after completing the activity',
        'Compare with your "before" emotion to see the impact',
        'This helps identify activities that improve or worsen your mood'
      ]
    },
    {
      title: 'Step 9: After - Rate Intensity & Reason',
      description: 'Rate how strongly you felt that emotion (1-5 scale) and explain why:',
      details: [
        '1 = Low intensity',
        '5 = High intensity',
        'Reason: Explain how or why the activity affected your emotions',
        'Example: "I feel relieved because the exam is over!"'
      ]
    },
    {
      title: '✅ All Done!',
      description: 'Your mood entry has been successfully logged! Over time, this data will help:',
      details: [
        'Identify which activities improve your mood',
        'Spot patterns in your emotional responses',
        'Track your overall wellbeing trends',
        'Get personalized recommendations based on your data'
      ]
    }
  ];

  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        style={{ backgroundColor: '#F1F8E8' }}
      >
        {/* Header - Compact */}
        <div 
          className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: '#55AD9B' }}
        >
          <h2 className="text-lg font-bold text-white">Data Logging Tutorial</h2>
          <button
            onClick={handleClose}
            className="hover:scale-110 transition-transform focus:outline-none"
            style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
            aria-label="Close tutorial"
          >
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '2rem', lineHeight: 1 }}>
              ×
            </span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {/* Step Title */}
          <h3 
            className="text-2xl font-bold mb-3"
            style={{ color: '#272829' }}
          >
            {step.title}
          </h3>

          {/* Step Description */}
          <p 
            className="text-base mb-4 leading-relaxed"
            style={{ color: '#555' }}
          >
            {step.description}
          </p>

          {/* Details List */}
          <div className="mb-6 space-y-2">
            {step.details.map((detail, index) => (
              <div 
                key={index}
                className="flex gap-3 p-2 rounded-lg"
                style={{ backgroundColor: '#D8EFD3' }}
              >
                <div 
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: '#95D2B3', color: '#272829' }}
                >
                  {index + 1}
                </div>
                <p 
                  className="flex-1 text-sm leading-relaxed"
                  style={{ color: '#272829' }}
                >
                  {detail}
                </p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span 
                className="text-xs font-semibold"
                style={{ color: '#272829' }}
              >
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <span 
                className="text-xs font-semibold"
                style={{ color: '#555' }}
              >
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
              </span>
            </div>
            <div 
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#D8EFD3' }}
            >
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  backgroundColor: '#55AD9B',
                  width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Footer with Navigation - Compact */}
        <div 
          className="px-6 py-3 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: '#F1F8E8', borderTop: '1px solid #D8EFD3' }}
        >
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:scale-105'
            }`}
            style={{
              backgroundColor: '#95D2B3',
              color: '#272829'
            }}
          >
            ← Previous
          </button>

          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={handleClose}
              className="py-2 px-6 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: '#55AD9B',
                color: '#F1F8E8'
              }}
            >
              Start 🚀
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: '#55AD9B',
                color: '#F1F8E8'
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
