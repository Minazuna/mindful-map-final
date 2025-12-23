# Weighted Mean Mood Prediction Algorithm

## Overview
The mood prediction system uses a weighted mean algorithm that considers **temporal weighting** (recent data is more important) to generate predictions based on occurrence frequency.

## Formula
```
Weighted Mean = Σ(wi × xi) / Σ(wi)

Where:
- wi = week weight (1, 2, 3, 4 for oldest to newest week)
- xi = frequency/count of mood occurrences in that week
- Σ(wi) = sum of all weights = 1 + 2 + 3 + 4 = 10
- Maximum probability cap: 90%
```

## Implementation Details

### Week Weight Assignment
- **Week 1 (oldest)**: Weight = 1
- **Week 2**: Weight = 2  
- **Week 3**: Weight = 3
- **Week 4 (most recent)**: Weight = 4

### Calculation Steps

1. **Data Collection**: Gather mood logs for the past 4 weeks (excluding current week)
2. **Count Mood Frequency**: For each mood per day, count total occurrences across all weeks
3. **Calculate Weighted Sum**: For each mood:
   ```
   Weighted Sum = Σ(week_weight × frequency_in_that_week)
   ```
   Example: Happy mood on Monday
   - Week 1: 2 occurrences → 1 × 2 = 2
   - Week 2: 3 occurrences → 2 × 3 = 6
   - Week 3: 4 occurrences → 3 × 4 = 12
   - Week 4: 5 occurrences → 4 × 5 = 20
   - **Total Weighted Sum = 2 + 6 + 12 + 20 = 40**

4. **Calculate Weighted Mean**: For each mood, apply the weighted mean formula:
   ```
   Weighted Mean = Weighted Sum / Σ(wi)
   Σ(wi) = 1 + 2 + 3 + 4 = 10
   ```

5. **Calculate Total Weighted Mean**: Sum weighted means for all moods

6. **Probability Calculation**: 
   ```
   Mood Probability = (Weighted Mean for Mood) / (Total Weighted Mean for all Moods)
   ```

7. **Percentage Conversion**: Convert to percentage with 90% maximum cap

8. **Prediction Selection**: Choose mood with highest probability (if tie, use latest/most recent entry)

### Example Calculation

**Monday Activity Category Prediction:**

**Sum of Weights:**
```
Σ(wi) = 1 + 2 + 3 + 4 = 10
```

**Happy Mood:**
- Week 1: 2 occurrences → 1 × 2 = 2
- Week 2: 3 occurrences → 2 × 3 = 6
- Week 3: 4 occurrences → 3 × 4 = 12
- Week 4: 5 occurrences → 4 × 5 = 20
- **Weighted Sum = 40**
- **Weighted Mean = 40 / 10 = 4.0**

**Calm Mood:**
- Week 1: 1 occurrence → 1 × 1 = 1
- Week 2: 2 occurrences → 2 × 2 = 4
- Week 3: 3 occurrences → 3 × 3 = 9
- Week 4: 4 occurrences → 4 × 4 = 16
- **Weighted Sum = 30**
- **Weighted Mean = 30 / 10 = 3.0**

**Total Weighted Mean = 4.0 + 3.0 = 7.0**

**Probabilities:**
- Happy: (4.0/7.0) × 100 = 57.1%
- Calm: (3.0/7.0) × 100 = 42.9%

**Predicted Mood: Happy at 57.1%**

## Benefits

1. **Recency Weighting**: More recent mood patterns have greater influence
2. **Frequency-Based**: Simple occurrence counting prevents bias from intensity variations
3. **Daily Representation**: Each occurrence is weighted equally per day
4. **Realistic Confidence**: 90% maximum cap prevents overconfidence
5. **Pattern Recognition**: Better identifies dominant mood trends across weeks
6. **Tie-Breaking**: Uses latest mood entry when there's a tie
7. **Personalized**: Based entirely on individual user data

## Actual Mood Determination

Actual moods are updated manually by admins via the admin dashboard:

1. **Dominant Mood Selection**: For each day and category, the system finds the mood with highest occurrence count
2. **Tie-Breaking**: If multiple moods have the same highest occurrence, the **latest/most recent mood** is selected
3. **Manual Trigger**: Admins navigate to a specific week using the dropdown in the Prediction Comparison page and click "Update Actual Moods" button to update all `PredictedMood` records for that week

### Example Actual Mood Update

**Monday Activity Category - Manual Update:**
- Logs: Happy (3 times), Calm (3 times), Relaxed (1 time)
- Dominant count: 3 (tied between Happy and Calm)
- Tie-breaker: Latest entry is Calm (recorded at 21:45)
- **Actual Mood: Calm**

## Files Modified

### Backend (Python):
- `backend/prediction.py`: Updated to use occurrence-based weighted mean (no intensity)

### Backend (JavaScript):  
- `backend/controllers/adminController.js`: Added `getConfusionMatrix()` endpoint
- `backend/routes/adminRoutes.js`: Added confusion matrix route
- `backend/server.js`: No scheduler initialization (manual updates only)

### Frontend:
- `frontend/src/components/Admin/PredictionComparison.jsx`: Added Daily Confusion Matrix visualization with colored heatmap (distinct colors for diagonal cells indicating correct predictions)

## Technical Notes

- The algorithm excludes current week data to prevent bias
- Minimum 2 weeks of data required for predictions
- Unknown emotions are filtered out
- All probabilities are capped at 90% maximum confidence
- Actual mood determination uses dominant (highest occurrence) mood, with latest entry as tie-breaker
- Confusion matrix visualizes predicted vs actual moods with distinct colors for diagonal (correct predictions)