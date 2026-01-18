require('dotenv').config();
const mongoose = require('mongoose');
const MoodLog = require('../models/MoodLog');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

// Categories and activities for variety
const categories = ['activity', 'social', 'health', 'sleep'];
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

// Negative emotions
const negativeEmotions = ['bored', 'sad', 'disappointed', 'angry', 'tense'];

// Flagged concerning keywords
const CONCERNING_KEYWORDS = [
  'depression', 'suicide', 'hopeless', 'worthless', 'self-harm', 'tired', 'overwhelmed', 'empty', 'give up', 'kill myself', 'no point', 'useless', 'pakamatay', 'magpakamatay', 'gusto ko na mamatay', 'ayoko na', 'ayaw ko na', 'laslas', 'maglaslas', 'i wanna kill myself', 'cut myself'
];

// Negative reasons using flagged keywords
const negativeReasons = [
  'Feeling overwhelmed with school work and life. #overwhelmed',
  'I feel hopeless about my future. #hopeless',
  'I am so tired, I want to give up. #tired #give up',
  'Sometimes I feel empty and worthless. #empty #worthless',
  'No point in trying anymore. #no point',
  'I want to cut myself. #self-harm #cut myself',
  'I just want to disappear. #depression',
  'I am thinking about suicide. #suicide',
  'Gusto ko na mamatay. #gusto ko na mamatay',
  'Ayoko na, pakamatay na lang. #ayoko na #pakamatay',
  'Had an argument with family, felt useless. #useless',
  'Failed my exam, felt like giving up. #give up',
  'Laslas na lang. #laslas',
  'Magpakamatay na lang ako. #magpakamatay',
  'I wanna kill myself. #i wanna kill myself',
];

// Helper functions
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Get Jan 19, 2026 (Monday) and Jan 25, 2026 (Sunday)
function getCustomWeekRange() {
  const start = new Date('2026-01-05T00:00:00.000Z'); // Monday
  const end = new Date('2026-01-11T23:59:59.999Z');   // Sunday
  return { start, end };
}

// Get a random date within Jan 5-11, 2026
function getRandomDateInCustomWeek() {
  const { start, end } = getCustomWeekRange();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function extractKeywords(reason) {
  // Extract keywords from reason (anything after #)
  const matches = reason.match(/#([a-zA-Z\s\-]+)/g);
  if (!matches) return [];
  return matches.map(k => k.replace('#', '').trim());
}

async function seedNegativeMoodLogs(count = 100) {
  await mongoose.connect(MONGO_URI);

  // Find users in "St. Paul VI (STEM 2)"
  const users = await User.find({ section: 'St. Paul VI (STEM 2)' }, '_id');
  if (!users.length) {
    console.log('No users found in St. Paul VI (STEM 2).');
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

    const emotion = getRandom(negativeEmotions);
    const reason = getRandom(negativeReasons);
    const keywords = extractKeywords(reason).filter(k => CONCERNING_KEYWORDS.includes(k));

    const moodLog = new MoodLog({
      user,
      date: getRandomDateInCustomWeek(), // Only within Jan 19-25, 2026
      category,
      activity: category !== 'sleep' ? activity : undefined,
      hrs: category === 'sleep' ? hrs : undefined,
      beforeValence: 'negative',
      beforeEmotion: emotion,
      beforeIntensity: Math.floor(Math.random() * 6), // 0-5
      beforeReason: reason,
      afterValence: 'negative',
      afterEmotion: emotion,
      afterIntensity: Math.floor(Math.random() * 5) + 1, // 1-5
      afterReason: reason,
      concerningKeywords: keywords
    });

    await moodLog.save();
    console.log(`Negative MoodLog created for user ${user} (${category}, ${emotion})`);
  }

  await mongoose.disconnect();
  console.log('Negative MoodLog seeding complete!');
}

seedNegativeMoodLogs().catch(err => {
  console.error(err);
  mongoose.disconnect();
});