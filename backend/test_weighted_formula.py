#!/usr/bin/env python3
"""
Test script to verify the weighted mean prediction formula
"""

def test_weighted_mean_formula():
    """
    Test the weighted mean formula implementation
    Based on the example provided in the attached image
    """
    print("Testing Weighted Mean Formula for Mood Prediction")
    print("=" * 50)
    
    # Example data from the image
    # Assuming we have data for "Today" (Monday)
    
    # Sample mood data with weights and intensities
    # Week weights: [1, 2, 3, 4] (oldest to newest)
    # Mood intensities from afterIntensity field (1-5 scale)
    
    # Happy mood data: Week1=1 count, Week2=3 counts, Week3=4 counts (with intensities)
    happy_data = [
        (1, 7.5),  # Week 1: 1 occurrence with intensity 7.5 (fictional for demo)
        (2, 8.5),  # Week 2: 1 occurrence with intensity 8.5 
        (2, 8.5),  # Week 2: another occurrence
        (2, 8.5),  # Week 2: another occurrence
        (3, 6.0),  # Week 3: 1 occurrence with intensity 6.0
        (3, 6.0),  # Week 3: another occurrence
        (3, 6.0),  # Week 3: another occurrence 
        (3, 6.0),  # Week 3: another occurrence
    ]
    
    # Stressed mood data: Week 2=2 counts
    stressed_data = [
        (2, 5.0),  # Week 2: 1 occurrence with intensity 5.0
        (2, 5.0),  # Week 2: another occurrence
    ]
    
    # Neutral mood data: Week 3=4 counts  
    neutral_data = [
        (3, 5.0),  # Week 3: 1 occurrence with intensity 5.0
        (3, 5.0),  # Week 3: another occurrence
        (3, 5.0),  # Week 3: another occurrence
        (3, 5.0),  # Week 3: another occurrence
    ]
    
    # Week weights (1=oldest, 4=newest)
    week_weights = [1, 2, 3, 4]
    
    # Calculate Weighted Intensity Sum (WIS) for each mood
    def calculate_wis(mood_data, week_weights):
        total_wis = 0.0
        for week_idx, intensity in mood_data:
            weight = week_weights[week_idx - 1]  # Convert 1-based to 0-based index
            wis = weight * intensity
            total_wis += wis
            print(f"  Week {week_idx}: weight={weight} × intensity={intensity} = {wis}")
        return total_wis
    
    print("\n1. Calculate WIS for each Mood:")
    print("\nHappy:")
    happy_wis = calculate_wis(happy_data, week_weights)
    print(f"  Total WIS (Happy) = {happy_wis}")
    
    print("\nStressed:")
    stressed_wis = calculate_wis(stressed_data, week_weights)
    print(f"  Total WIS (Stressed) = {stressed_wis}")
    
    print("\nNeutral:")
    neutral_wis = calculate_wis(neutral_data, week_weights)
    print(f"  Total WIS (Neutral) = {neutral_wis}")
    
    # Calculate Total Weighted Intensity
    total_wis = happy_wis + stressed_wis + neutral_wis
    print(f"\n2. Calculate Total Weighted Intensity:")
    print(f"   Total WIS = {happy_wis} + {stressed_wis} + {neutral_wis} = {total_wis}")
    
    # Calculate probabilities using weighted mean formula
    print(f"\n3. Calculate Probability Percentages:")
    print(f"   Weighted Mean = Σ(wi × xi) / Σ(wi)")
    
    happy_prob = (happy_wis / total_wis) * 100
    stressed_prob = (stressed_wis / total_wis) * 100  
    neutral_prob = (neutral_wis / total_wis) * 100
    
    print(f"\n   Probability (Happy): ({happy_wis}/{total_wis}) × 100 = {happy_prob:.1f}%")
    print(f"   Probability (Stressed): ({stressed_wis}/{total_wis}) × 100 = {stressed_prob:.1f}%")
    print(f"   Probability (Neutral): ({neutral_wis}/{total_wis}) × 100 = {neutral_prob:.1f}%")
    
    # Apply 90% maximum cap
    print(f"\n4. Apply 90% Maximum Cap:")
    happy_prob_capped = min(happy_prob, 90.0)
    stressed_prob_capped = min(stressed_prob, 90.0) 
    neutral_prob_capped = min(neutral_prob, 90.0)
    
    print(f"   Probability (Happy) capped: {happy_prob_capped:.1f}%")
    print(f"   Probability (Stressed) capped: {stressed_prob_capped:.1f}%") 
    print(f"   Probability (Neutral) capped: {neutral_prob_capped:.1f}%")
    
    # Determine predicted mood (highest probability)
    moods = [
        ("Happy", happy_prob_capped),
        ("Stressed", stressed_prob_capped), 
        ("Neutral", neutral_prob_capped)
    ]
    
    predicted_mood = max(moods, key=lambda x: x[1])
    
    print(f"\n5. Predicted Mood:")
    print(f"   Highest probability: {predicted_mood[0]} ({predicted_mood[1]:.1f}%)")
    
    print("\n" + "=" * 50)
    print("Formula Verification Complete!")

if __name__ == "__main__":
    test_weighted_mean_formula()