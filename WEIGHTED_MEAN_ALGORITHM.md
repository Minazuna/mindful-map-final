# Weighted Mean Mood Prediction Algorithm

## Overview
The mood prediction system now uses a weighted mean algorithm that considers both **temporal weighting** (recent data is more important) and **mood intensity** to generate more accurate predictions.

## Formula
```
Weighted Mean = Σ(wi × xi) / Σ(wi)

Where:
- wi = week weight × mood intensity
- xi = 1 (occurrence indicator)  
- Week weights: [1, 2, 3, 4] (oldest to newest)
- Mood intensity: 1-5 scale from afterIntensity field
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
2. **Daily Intensity Averaging**: For multiple same moods on the same day:
   ```
   Average Intensity = Sum of intensities / Number of entries
   Example: Happy on Nov 18 with intensities [2, 8] → Average = 5.0
   ```
3. **Weighted Intensity Calculation**: For each averaged mood per day:
   ```
   Weighted Intensity = Week Weight × Average Daily Intensity
   ```
4. **Mood Aggregation**: Sum weighted intensities for each mood type across all days
5. **Probability Calculation**: 
   ```
   Mood Probability = (Sum of Weighted Intensities for Mood) / (Total Weighted Intensities)
   ```
6. **Percentage Conversion**: Convert to percentage with 90% maximum cap
7. **Prediction Selection**: Choose mood with highest probability

### Example Calculation

Assuming data for Monday:

**Nov 18 (Monday) - Week 4:**
- **Happy entries**: intensities [2, 8] → Average = 5.0 → WIS = 4 × 5.0 = 20.0
- **Neutral entries**: intensities [5] → Average = 5.0 → WIS = 4 × 5.0 = 20.0

**Total WIS = 20.0 + 20.0 = 40.0**

**Probabilities:**
- Happy: (20.0/40.0) × 100 = 50.0%
- Neutral: (20.0/40.0) × 100 = 50.0%

**Predicted Mood: Tied at 50% (system would select first alphabetically or use tiebreaker)**

**Comparison with Old Aggregation Method:**
- Old: Happy WIS = 4 × (2+8) = 40, Neutral WIS = 4 × 5 = 20 → Happy 66.7%
- New: Happy WIS = 4 × 5.0 = 20, Neutral WIS = 4 × 5.0 = 20 → Happy 50.0%
- **Result**: More balanced predictions, less bias toward frequent entries

## Benefits

1. **Recency Weighting**: More recent mood patterns have greater influence
2. **Intensity Consideration**: Higher intensity moods are weighted more heavily
3. **Balanced Daily Representation**: Multiple entries per day are averaged, preventing over-influence
4. **Realistic Confidence**: 90% maximum cap prevents overconfidence
5. **Pattern Recognition**: Better identifies significant mood trends without frequency bias
6. **Personalized**: Based entirely on individual user data

## Files Modified

### Backend (Python):
- `backend/app.py`: Updated `prepare_category_data()` method

### Backend (JavaScript):  
- `backend/controllers/adminController.js`: Updated `calculateDayPredictionPythonLogic()` and `calculateDayPrediction()`

### Frontend:
- `frontend/src/components/User/Prediction/Prediction.jsx`: Updated descriptions and disclaimers

## Technical Notes

- The algorithm excludes current week data to prevent bias
- Minimum 2 weeks of data required for predictions
- Unknown emotions are filtered out
- Default intensity of 0 used if afterIntensity field is missing
- All probabilities are capped at 90% maximum confidence