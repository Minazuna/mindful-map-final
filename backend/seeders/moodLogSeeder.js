require('dotenv').config();
const mongoose = require('mongoose');
const MoodLog = require('../models/MoodLog');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

// Emotions and sample reasons
const positiveEmotions = ['calm', 'excited', 'happy', 'pleased', 'relaxed'];
const negativeEmotions = ['bored', 'sad', 'disappointed', 'angry', 'tense'];
const emotions = [...positiveEmotions, ...negativeEmotions];

const positiveReasons = [
  'Had a great conversation with a friend.',
  'Achieved a personal goal.',
  'Enjoyed a relaxing activity.',
  'Felt appreciated by others.',
  'Had a productive day.',
  'Spent quality time with family.',
  'Received good news.',
  'Completed a challenging task.',
  'Felt healthy and energetic.',
  'Experienced something new and fun.'
];

const negativeReasons = [
  'Had an argument with someone.',
  'Felt overwhelmed by tasks.',
  'Did not sleep well.',
  'Missed an important deadline.',
  'Felt left out in a group.',
  'Received disappointing news.',
  'Was not feeling well physically.',
  'Experienced a stressful situation.',
  'Felt lonely or isolated.',
  'Had a lack of motivation.'
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getReasonForEmotion(emotion) {
  if (positiveEmotions.includes(emotion)) {
    return getRandom(positiveReasons);
  } else if (negativeEmotions.includes(emotion)) {
    return getRandom(negativeReasons);
  }
  return '';
}

const categories = ['activity', 'social', 'health', 'sleep'];
const beforeValences = ['positive', 'negative', "can't remember"];
const afterValences = ['positive', 'negative'];

const activityIds = [
  'commute', 'exam', 'homework', 'study', 'project', 'read', 'extracurricular',
  'household-chores', 'relax', 'watch-movie', 'listen-music', 'gaming',
  'browse-internet', 'shopping', 'travel'
];

const socialIds = [
  'alone', 'friends', 'family', 'classmates', 'relationship', 'online', 'pet'
];

const healthIds = [
  'jog', 'walk', 'exercise', 'sports', 'meditate', 'eat-healthy',
  'no-physical', 'eat-unhealthy', 'drink-alcohol'
];

// Always use today's date
function getTodayDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

async function seedNanaMoodLogs() {
  await mongoose.connect(MONGO_URI);

  const nana = await User.findOne({ email: 'nana@gmail.com' });
  if (!nana) {
    console.log('User nana@gmail.com not found!');
    return;
  }

  const logs = [];

  // ACTIVITY category
  const activityLogs = [
    ...Array(3).fill({ activity: 'study' }),
    ...Array(4).fill({ activity: 'gaming' }),
    ...Array(3).fill({ activity: 'commute' }),
    ...Array(3).fill({ activity: 'exam' }),
  ];
  activityLogs.forEach(log => {
    const afterValence = getRandom(afterValences);
    const afterEmotion = afterValence === 'positive'
      ? getRandom(positiveEmotions)
      : getRandom(negativeEmotions);
    logs.push({
      user: nana._id,
      date: getTodayDate(),
      category: 'activity',
      activity: log.activity,
      beforeValence: getRandom(beforeValences),
      beforeEmotion: getRandom(emotions),
      beforeIntensity: Math.floor(Math.random() * 6),
      beforeReason: getReasonForEmotion(getRandom(emotions)),
      afterValence,
      afterEmotion,
      afterIntensity: Math.floor(Math.random() * 5) + 1,
      afterReason: getReasonForEmotion(afterEmotion)
    });
  });

  // SOCIAL category
  const socialLogs = [
    ...Array(3).fill({ activity: 'family' }),
    ...Array(2).fill({ activity: 'relationship' }),
    ...Array(3).fill({ activity: 'classmates' }),
    ...Array(3).fill({ activity: 'friends' }),
  ];
  socialLogs.forEach(log => {
    const afterValence = getRandom(afterValences);
    const afterEmotion = afterValence === 'positive'
      ? getRandom(positiveEmotions)
      : getRandom(negativeEmotions);
    logs.push({
      user: nana._id,
      date: getTodayDate(),
      category: 'social',
      activity: log.activity,
      beforeValence: getRandom(beforeValences),
      beforeEmotion: getRandom(emotions),
      beforeIntensity: Math.floor(Math.random() * 6),
      beforeReason: getReasonForEmotion(getRandom(emotions)),
      afterValence,
      afterEmotion,
      afterIntensity: Math.floor(Math.random() * 5) + 1,
      afterReason: getReasonForEmotion(afterEmotion)
    });
  });

  // HEALTH category
  const healthLogs = [
    ...Array(3).fill({ activity: 'jog' }),
    ...Array(3).fill({ activity: 'exercise' }),
    ...Array(3).fill({ activity: 'eat-healthy' }),
    ...Array(3).fill({ activity: 'no-physical' }),
  ];
  healthLogs.forEach(log => {
    const afterValence = getRandom(afterValences);
    const afterEmotion = afterValence === 'positive'
      ? getRandom(positiveEmotions)
      : getRandom(negativeEmotions);
    logs.push({
      user: nana._id,
      date: getTodayDate(),
      category: 'health',
      activity: log.activity,
      beforeValence: getRandom(beforeValences),
      beforeEmotion: getRandom(emotions),
      beforeIntensity: Math.floor(Math.random() * 6),
      beforeReason: getReasonForEmotion(getRandom(emotions)),
      afterValence,
      afterEmotion,
      afterIntensity: Math.floor(Math.random() * 5) + 1,
      afterReason: getReasonForEmotion(afterEmotion)
    });
  });

  // SLEEP category (hrs only)
  const sleepLogs = [
    ...Array(4).fill({ hrs: 6 }),
    ...Array(3).fill({ hrs: 8 }),
    ...Array(3).fill({ hrs: 5 }),
  ];
  sleepLogs.forEach(log => {
    const afterValence = getRandom(afterValences);
    const afterEmotion = afterValence === 'positive'
      ? getRandom(positiveEmotions)
      : getRandom(negativeEmotions);
    logs.push({
      user: nana._id,
      date: getTodayDate(),
      category: 'sleep',
      hrs: log.hrs,
      beforeValence: getRandom(beforeValences),
      beforeEmotion: getRandom(emotions),
      beforeIntensity: Math.floor(Math.random() * 6),
      beforeReason: getReasonForEmotion(getRandom(emotions)),
      afterValence,
      afterEmotion,
      afterIntensity: Math.floor(Math.random() * 5) + 1,
      afterReason: getReasonForEmotion(afterEmotion)
    });
  });

  // Insert all logs
  await MoodLog.insertMany(logs);
  console.log(`Seeded ${logs.length} mood logs for nana@gmail.com`);

  await mongoose.disconnect();
}

seedNanaMoodLogs().catch(err => {
  console.error(err);
  mongoose.disconnect();
});