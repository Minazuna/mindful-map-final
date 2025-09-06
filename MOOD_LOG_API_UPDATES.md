# MoodLog API Updates

## Data Structure

The MoodLog model has been completely restructured to support category-based mood tracking with before/after valence analysis.

### MoodLog Schema

```javascript
{
  user: ObjectId,              // Reference to User
  date: Date,                  // Entry timestamp
  category: String,            // Required: 'activity', 'social', 'health', 'sleep'
  
  // For activity, social, and health categories
  activity: String,            // The specific activity/interaction/health habit
  
  // For sleep category only
  hrs: Number,                 // Hours of sleep
  
  // Before valence tracking
  beforeValence: String,       // Required: 'positive', 'negative', 'can't remember'
  beforeEmotion: String,       // Required if beforeValence !== 'can't remember'
  beforeIntensity: Number,     // Required if beforeValence !== 'can't remember' (1-5)
  beforeReason: String,        // Required if beforeValence !== 'can't remember' (max 500 chars, 100 words)
  
  // After valence tracking
  afterValence: String,        // Required: 'positive', 'negative'
  afterEmotion: String,        // Required
  afterIntensity: Number,      // Required (1-5)
  afterReason: String          // Required (max 500 chars, 100 words)
}
```

## API Endpoints

### POST `/api/mood-log`
Save a new mood log entry.

**Request Body:**
```javascript
{
  "category": "activity|social|health|sleep",
  "activity": "selected activity/interaction/habit", // Required for non-sleep categories
  "hrs": 8,                                         // Required for sleep category
  "beforeValence": "positive|negative|can't remember",
  "beforeEmotion": "happy|sad|etc",                 // Optional if beforeValence is "can't remember"
  "beforeIntensity": 3,                             // Optional if beforeValence is "can't remember"
  "beforeReason": "description of why...",          // Optional if beforeValence is "can't remember"
  "afterValence": "positive|negative",
  "afterEmotion": "relaxed|energized|etc",
  "afterIntensity": 4,
  "afterReason": "description of why..."
}
```

**Special Behavior for Sleep:**
- Only one sleep entry per day is allowed
- If a sleep entry already exists for today, it will be updated instead of creating a new one

### GET `/api/mood-log`
Get all mood logs for the authenticated user, sorted by date (newest first).

### GET `/api/mood-log/paginated`
Get paginated mood logs with optional category filtering.

**Query Parameters:**
- `month`: Month number (1-12)
- `year`: Year (e.g., 2025)
- `page`: Page number (default: 0)
- `limit`: Items per page (default: 4)
- `category`: Optional filter by category

### GET `/api/mood-log/category/:category`
Get all mood logs for a specific category.

**Parameters:**
- `category`: One of 'activity', 'social', 'health', 'sleep'

### GET `/api/mood-log/sleep/today`
Get today's sleep log specifically.

### GET `/api/mood-log/today-last`
Get the most recent mood log for today, with optional category filtering.

**Query Parameters:**
- `category`: Optional filter by category

### GET `/api/check-mood-logs`
Check if user has been logging consistently (used for access control).

## Usage Examples

### Saving an Activity Entry
```javascript
POST /api/mood-log
{
  "category": "activity",
  "activity": "Exercise",
  "beforeValence": "negative",
  "beforeEmotion": "tired",
  "beforeIntensity": 2,
  "afterValence": "positive",
  "afterEmotion": "energized",
  "afterIntensity": 4
}
```

### Saving a Sleep Entry
```javascript
POST /api/mood-log
{
  "category": "sleep",
  "hrs": 7.5,
  "beforeValence": "can't remember",
  "afterValence": "positive",
  "afterEmotion": "refreshed",
  "afterIntensity": 3
}
```

### Updating Sleep Hours (same day)
```javascript
POST /api/mood-log
{
  "category": "sleep",
  "hrs": 8,
  "beforeValence": "negative",
  "beforeEmotion": "anxious",
  "beforeIntensity": 3,
  "afterValence": "positive",
  "afterEmotion": "calm",
  "afterIntensity": 4
}
```

## Migration Notes

- The old schema with `mood`, `moodScore`, `activities[]`, `social[]`, `health[]`, and `sleepQuality` has been completely replaced
- Each entry now represents a single category item with before/after emotional tracking
- Multiple entries per day are allowed for activity, social, and health categories
- Sleep category allows only one entry per day (updates existing entry)
- All entries now include emotional valence and intensity tracking
