const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: false,
    trim: true
  },
  middleInitial: {
    type: String,
    required: false,
    maxlength: 2,
    trim: true,
    uppercase: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Rather not say'],
    default: 'Rather not say'
  },
  section: {
    type: String,
    enum: ['St. John Paul II (STEM 1)', 'St. Paul VI (STEM 2)', 'St. John XXIII (STEM 3)', 'St. Pius X (HUMSS)', 'St. Tarcisius (ABM)', 'St. Jose Sanchez Del Rio (ICT)', 'N/A'],
    default: 'N/A',
    required: false,
  },
  assignedSections: {
    type: [String],
    enum: ['St. John Paul II (STEM 1)', 'St. Paul VI (STEM 2)', 'St. John XXIII (STEM 3)', 'St. Pius X (HUMSS)', 'St. Tarcisius (ABM)', 'St. Jose Sanchez Del Rio (ICT)'],
    required: function() {
      return this.role === 'teacher';
    }
  },
  subject: {
    type: String,
    required: function() {
      return this.role === 'teacher';
    },
    trim: true
  },
  avatar: {
    type: String, 
    required: false,
    default: 'https://res.cloudinary.com/your-cloud/image/upload/v1/default-avatar.png'
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'teacher'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  pendingDeactivation: {
    type: Boolean,
    default: false
  },
  deactivateAt: {
    type: Date,
    default: null
  },
  isDeactivated: { 
    type: Boolean, 
    default: false 
  },
  deactivatedAt: {
    type: Date,
    default: null,
  },
  hasRequestedReactivation: {
    type: Boolean,
    default: false
  }
});

// Hash the password before saving the user
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare the entered password with the hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);