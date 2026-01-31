const mongoose = require("mongoose");

/**
 * ConcordanceResult
 * Stores ONE daily snapshot per user (not one per category).
 * Shape matches concordanceController.js which writes:
 *   { user, date, results, thresholds, computedAt }
 */
const concordanceResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Anchor datetime representing the day being analyzed (your controller likely uses "local noon")
    date: {
      type: Date,
      required: true
    },

    /**
     * Per-category results map (activity/social/health/sleep).
     * Kept as Mixed to avoid schema drift when Python output changes.
     *
     * Expected example:
     * {
     *   activity: {
     *     ccc: { overall, includedGroups, ignoredGroups, groupMeans, groupCounts, labels, thresholds, interpretation },
     *     topPositive: [{ activity, moodScore }],
     *     topNegative: [{ activity, moodScore }],
     *     groupLastIds: { [activity]: "<moodLogId>" }
     *   },
     *   social: { ... },
     *   health: { ... },
     *   sleep: { ...optional... }
     * }
     */
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Thresholds used for the run (minPairs, etc.)
    thresholds: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // When this snapshot was computed
    computedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    minimize: false, // keep empty objects so results/thresholds are persisted
    timestamps: false
  }
);

// Enforce ONE snapshot per user per day
concordanceResultSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("ConcordanceResult", concordanceResultSchema);