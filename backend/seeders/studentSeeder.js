require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('../config/firebaseConfig'); 

const MONGO_URI = process.env.MONGO_URI;

const sections = [
  'St. John Paul II (STEM 1)',
  'St. Paul VI (STEM 2)',
  'St. John XXIII (STEM 3)',
  'St. Pius X (HUMSS)',
  'St. Tarcisius (ABM)',
  'St. Jose Sanchez Del Rio (ICT)'
];

const firstNames = ['Alice', 'Bennedict', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia', 'Anna', 'Michael', 'Sam', 'Eric', 'Mark', 'Louis', 'Bea', 'Nick', 'Michelle'];
const lastNames = ['Perez', 'Reyes', 'Cruz', 'Delo Santos', 'Mendoza', 'Lopez', 'Garcia', 'Davis', 'Santos', 'Torres', 'Florendo', 'Ramos', 'Go', 'Navarro', 'Salazar', 'Chua', 'Guerrero'];
const genders = ['Male', 'Female'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedStudents(count = 20) {
  await mongoose.connect(MONGO_URI);

  for (let i = 0; i < count; i++) {
    const firstName = getRandom(firstNames);
    const lastName = getRandom(lastNames);
    const gender = getRandom(genders);
    const section = sections[i % sections.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`;
    const password = '123456';

    let firebaseUid;
    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
      });
      firebaseUid = userRecord.uid;
      console.log(`Firebase user created: ${email}`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        // If already exists, get the user
        const userRecord = await admin.auth().getUserByEmail(email);
        firebaseUid = userRecord.uid;
        console.log(`Firebase user already exists: ${email}`);
      } else {
        console.error(`Failed to create Firebase user for ${email}:`, err.message);
        continue; 
      }
    }

    // Create user in MongoDB
    const user = new User({
      email,
      firstName,
      lastName,
      gender,
      section,
      firebaseUid,
      password,
      role: 'user',
      provider: 'email'
    });

    try {
      await user.save();
      console.log(`MongoDB user created: ${email} (${section})`);
    } catch (err) {
      if (err.code === 11000) {
        console.log(`MongoDB user already exists: ${email}`);
      } else {
        console.error(`Failed to create MongoDB user for ${email}:`, err.message);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Student seeding complete!');
}

seedStudents().catch(err => {
  console.error(err);
  mongoose.disconnect();
});