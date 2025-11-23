require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB - Running Music Migration');
  
  try {
    const Music = require('./models/Music');
    
    // Update all music records that don't have isActive set to true
    const result = await Music.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    
    console.log('Migration completed!');
    console.log('Modified records:', result.modifiedCount);
    
    // Also set any false isActive to true (unless you specifically want some disabled)
    const result2 = await Music.updateMany(
      { isActive: false },
      { $set: { isActive: true } }
    );
    
    console.log('Activated disabled records:', result2.modifiedCount);
    
    // Check final counts
    const totalMusic = await Music.countDocuments({});
    const activeMusic = await Music.countDocuments({ isActive: true });
    
    console.log('Final counts:');
    console.log('Total music:', totalMusic);
    console.log('Active music:', activeMusic);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.connection.close();
  }
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});