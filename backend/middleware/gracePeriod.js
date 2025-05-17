const { processExpiredGracePeriods } = require('../utils/accountService');

const checkGracePeriods = async (req, res, next) => {
  try {
    // Process expired grace periods with better logging
    console.log("Running checkGracePeriods middleware...");
    
    processExpiredGracePeriods()
      .then(result => {
        console.log(`Grace period check completed. Processed ${result.processedCount} expired grace periods`);
      })
      .catch(error => {
        console.error("Error in grace period check:", error);
      });
    
    next();
  } catch (error) {
    console.error("Error in grace period middleware:", error);
    next();
  }
};
  
  module.exports = checkGracePeriods;