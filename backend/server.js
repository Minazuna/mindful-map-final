require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const moodLogRoutes = require('./routes/moodLogRoutes');
const journalRoutes = require('./routes/journalRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const moodPredictionRoutes = require("./routes/moodPredictionRoutes");
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const correlationRoutes = require('./routes/correlationRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const anovaRoutes = require('./routes/anovaRoutes');
const activityRoutes = require('./routes/activityRoutes');
const musicRoutes = require('./routes/musicRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors()); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', moodLogRoutes);
app.use('/api', journalRoutes);
app.use('/api', analysisRoutes);
app.use('/api', moodPredictionRoutes);
app.use('/api', correlationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api', statisticsRoutes);
app.use('/api/anova', anovaRoutes);
app.use('/api/recommendation', recommendationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/music', musicRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});