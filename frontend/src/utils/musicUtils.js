// Music utility functions

export const getCategoryIcon = (category) => {
  const icons = {
    calming: '🌿',
    uplifting: '☀️',
    meditation: '🧘',
    focus: '🎯',
    sleep: '😴',
    nature: '🌲'
  };
  
  return icons[category.toLowerCase()] || '🎵';
};

export const getCategoryDisplayName = (category) => {
  const names = {
    calming: 'Calming',
    uplifting: 'Uplifting',
    meditation: 'Meditation',
    focus: 'Focus',
    sleep: 'Sleep',
    nature: 'Nature'
  };
  
  return names[category.toLowerCase()] || category;
};

export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};