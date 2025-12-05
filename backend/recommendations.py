import json
import os
import hashlib

json_path = os.path.join(os.path.dirname(__file__), 'utils', 'recommendations.json')
with open(json_path, 'r', encoding='utf-8') as f:
    RECOMMENDATIONS = json.load(f)

def _stable_pick_order(recs, key_str):
    """
    Return a deterministic order of recs based on key_str.
    """
    def rank(item):
        h = hashlib.sha256((key_str + '|' + str(item)).encode('utf-8')).hexdigest()
        return int(h[:16], 16)
    return sorted(recs, key=rank)

def _top_n(recs, key_str, n=3):
    if not recs:
        return []
    ordered = _stable_pick_order(recs, key_str)
    return ordered[:n]

def _top_category(cat: str):
    c = (cat or '').strip().lower()
    if c == 'sleep': return 'Sleep'
    if c == 'activity': return 'Activity'
    if c == 'social': return 'Social'
    if c == 'health': return 'Health'
    # Already capitalized correctly
    if cat in ('Sleep', 'Activity', 'Social', 'Health'):
        return cat
    return None

def _norm_activity(a: str):
    # normalize to match JSON keys (e.g., "study", "read", "exercise")
    return (a or '').strip().lower()

def get_recommendations(category, activity, mood_type, sleep_hours=None, n=3):
    """
    Return up to n recommendations (as a list), chosen deterministically
    from the recommendations.json based on the input context.
    """
    top_cat = _top_category(category)
    act = _norm_activity(activity)
    mood_key = 'positive' if (mood_type or '').strip().lower() == 'positive' else 'negative'

    key_str = '|'.join([
        str(top_cat or ''),
        str(act or ''),
        str(mood_key),
        str(sleep_hours if sleep_hours is not None else '')
    ])

    if top_cat == 'Sleep':
        if sleep_hours is None:
            return []
        if sleep_hours < 7:
            recs = RECOMMENDATIONS.get('Sleep', {}).get('less', [])
        elif sleep_hours > 9:
            recs = RECOMMENDATIONS.get('Sleep', {}).get('more', [])
        else:
            recs = RECOMMENDATIONS.get('Sleep', {}).get('enough', [])
        return _top_n(recs, key_str, n)

    if not top_cat:
        return []

    try:
        bucket = RECOMMENDATIONS[top_cat]
        recs = bucket.get(act, {}).get(mood_key, [])
    except Exception:
        recs = []

    return _top_n(recs, key_str, n)

if __name__ == "__main__":
    import sys
    category = sys.argv[1] if len(sys.argv) > 1 else ''
    activity = sys.argv[2] if len(sys.argv) > 2 else ''
    mood_type = sys.argv[3] if len(sys.argv) > 3 else ''
    sleep_hours = None
    if len(sys.argv) > 4 and sys.argv[4]:
        try:
            sleep_hours = float(sys.argv[4])
        except:
            sleep_hours = None

    print(json.dumps(get_recommendations(category, activity, mood_type, sleep_hours, n=3)))