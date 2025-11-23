import json
import random
import os

json_path = os.path.join(os.path.dirname(__file__), 'utils', 'recommendations.json')
with open(json_path, 'r', encoding='utf-8') as f:
    RECOMMENDATIONS = json.load(f)

def get_recommendation(category, activity, mood_type, sleep_hours=None, n=2):
    if category == "Sleep":
        if sleep_hours is None:
            return []
        if sleep_hours < 7:
            recs = RECOMMENDATIONS["Sleep"]["less"]
        elif sleep_hours > 9:
            recs = RECOMMENDATIONS["Sleep"]["more"]
        else:
            recs = RECOMMENDATIONS["Sleep"]["enough"]
        return random.sample(recs, min(n, len(recs)))
    else:
        mood_key = "positive" if mood_type == "positive" else "negative"
        try:
            recs = RECOMMENDATIONS[category][activity][mood_key]
            return random.sample(recs, min(n, len(recs)))
        except KeyError:
            return []


if __name__ == "__main__":
    import sys
    category = sys.argv[1] if len(sys.argv) > 1 else None
    activity = sys.argv[2] if len(sys.argv) > 2 else None
    mood_type = sys.argv[3] if len(sys.argv) > 3 else None
    sleep_hours = float(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] else None

    recs = get_recommendation(category, activity, mood_type, sleep_hours)
    print(json.dumps(recs))