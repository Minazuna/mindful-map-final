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

// Use your provided IDs for each category
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

// Generate a random date within the current month (including today)
function getRandomDateThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedMoodLogs(count = 50) {
  await mongoose.connect(MONGO_URI);

  // Get the last 20 created users (sorted by creation date descending)
  const users = await User.find({}, '_id').sort({ createdAt: -1 }).limit(20);
  if (!users.length) {
    console.log('No users found. Seed users first!');
    return;
  }

  for (let i = 0; i < count; i++) {
    const user = getRandom(users)._id;
    const category = getRandom(categories);

    let activity = undefined;
    let hrs = undefined;
    if (category === 'sleep') {
      hrs = Math.floor(Math.random() * 10) + 1; // 1-10 hours
    } else if (category === 'activity') {
      activity = getRandom(activityIds);
    } else if (category === 'social') {
      activity = getRandom(socialIds);
    } else if (category === 'health') {
      activity = getRandom(healthIds);
    }

    const beforeValence = getRandom(beforeValences);
    let beforeEmotion = null;
    let beforeIntensity = 0;
    let beforeReason = null;
    if (beforeValence !== "can't remember") {
      beforeEmotion = beforeValence === 'positive'
        ? getRandom(positiveEmotions)
        : getRandom(negativeEmotions);
      beforeIntensity = Math.floor(Math.random() * 6); // 0-5
      beforeReason = getReasonForEmotion(beforeEmotion);
    }

    const afterValence = getRandom(afterValences);
    const afterEmotion = afterValence === 'positive'
      ? getRandom(positiveEmotions)
      : getRandom(negativeEmotions);
    const afterIntensity = Math.floor(Math.random() * 5) + 1; // 1-5
    const afterReason = getReasonForEmotion(afterEmotion);

    const moodLog = new MoodLog({
      user,
      date: getRandomDateThisMonth(),
      category,
      activity: category !== 'sleep' ? activity : undefined,
      hrs: category === 'sleep' ? hrs : undefined,
      beforeValence,
      beforeEmotion,
      beforeIntensity,
      beforeReason,
      afterValence,
      afterEmotion,
      afterIntensity,
      afterReason
    });

    await moodLog.save();
    console.log(`MoodLog created for user ${user} (${category})`);
  }

  await mongoose.disconnect();
  console.log('MoodLog seeding complete!');
}

seedMoodLogs().catch(err => {
  console.error(err);
  mongoose.disconnect();
});