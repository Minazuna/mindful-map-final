# anova.py
import numpy as np
from scipy.stats import f_oneway
from flask import Flask, request, jsonify
from flask_cors import CORS
import math
from statsmodels.stats.multicomp import pairwise_tukeyhsd

app = Flask(__name__)
CORS(app)

def safe_number(val):
    # Replace NaN or inf with None for JSON compatibility
    if isinstance(val, (float, np.floating)) and (np.isnan(val) or np.isinf(val)):
        return None
    return val

def compute_anova(groups_dict):
    groups = list(groups_dict.values())
    groups = [g for g in groups if len(g) > 0]

    if len(groups) < 2:
        return None

    # --- One-way ANOVA ---
    try:
        F_value, p_value = f_oneway(*groups)
    except Exception:
        F_value, p_value = float('nan'), float('nan')

    # --- Compute MSB & MSW manually ---
    all_values = [score for values in groups_dict.values() for score in values]
    overall_mean = np.mean(all_values) if all_values else 0

    # Sum of squares between groups (SSB)
    SSB = sum(len(values) * (np.mean(values) - overall_mean) ** 2 for values in groups_dict.values() if len(values) > 0)
    df_between = len([v for v in groups_dict.values() if len(v) > 0]) - 1
    MSB = SSB / df_between if df_between > 0 else None

    # Sum of squares within groups (SSW)
    SSW = sum(sum((np.array(values) - np.mean(values)) ** 2) for values in groups_dict.values() if len(values) > 0)
    df_within = len(all_values) - len([v for v in groups_dict.values() if len(v) > 0])
    MSW = SSW / df_within if df_within > 0 else None

    # --- Tukey HSD ---
    tukey_results = []
    try:
        # Prepare data for Tukey HSD
        data = []
        labels = []
        for group_name, values in groups_dict.items():
            for v in values:
                data.append(v)
                labels.append(group_name)
        if len(set(labels)) > 1 and len(data) > len(set(labels)):
            tukey = pairwise_tukeyhsd(endog=np.array(data), groups=np.array(labels), alpha=0.05)
            for res in tukey.summary().data[1:]:
                tukey_results.append({
                    "group1": res[0],
                    "group2": res[1],
                    "meandiff": safe_number(round(res[2], 2)),
                    "p-adj": safe_number(round(res[4], 4)),
                    "lower": safe_number(round(res[5], 2)),
                    "upper": safe_number(round(res[6], 2)),
                    "reject": bool(res[7])
                })
    except Exception:
        tukey_results = []

    return {
        "F_value": safe_number(round(F_value, 4)) if F_value is not None else None,
        "p_value": safe_number(round(p_value, 6)) if p_value is not None else None,
        "MSB": safe_number(round(MSB, 4)) if MSB is not None else None,
        "MSW": safe_number(round(MSW, 4)) if MSW is not None else None,
        "tukeyHSD": tukey_results
    }

@app.route('/api/run-anova', methods=['POST'])
def run_anova():
    """
    Expects:
    {
        "data": {
            "activity": {
                "exam": [10, 20, -5],
                "reading": [30, 25],
                ...
            },
            "social": {...},
            ...
        }
    }
    """
    body = request.get_json()

    if "data" not in body:
        return jsonify({"success": False, "error": "Missing data"}), 400

    categories = body["data"]
    results = {}
    insufficient = True

    for category, groups in categories.items():
        # Check if there are at least 2 groups with at least 2 values each
        valid_groups = [scores for scores in groups.values() if len(scores) > 0]
        total_values = sum(len(scores) for scores in groups.values())
        if not groups or total_values < 2 or len(valid_groups) < 2 or any(len(scores) < 1 for scores in valid_groups):
            results[category] = {
                "success": False,
                "message": "Logs are still insufficient to run a proper analysis. Come back later!"
            }
            continue

        insufficient = False
        anova_output = compute_anova(groups)

        if anova_output is None:
            results[category] = {
                "success": False,
                "message": "Logs are still insufficient to run a proper analysis. Come back later!"
            }
            continue

        # Determine top positive & negative activities
        flat_scores = []
        for activity, scores in groups.items():
            if len(scores) > 0:
                avg_score = np.mean(scores)
                flat_scores.append([activity, round(avg_score, 2)])

        top_positive = sorted([x for x in flat_scores if x[1] > 0], key=lambda x: -x[1])[:3]
        top_negative = sorted([x for x in flat_scores if x[1] < 0], key=lambda x: x[1])[:3]

        # Add interpretation
        interpretation = (
            "There is a significant difference between activities."
            if anova_output["p_value"] is not None and anova_output["p_value"] < 0.05
            else "No significant difference between the activities."
        )

        results[category] = {
            **anova_output,
            "interpretation": interpretation,
            "topPositive": top_positive,
            "topNegative": top_negative
        }

    # If all categories are insufficient, return a friendly message
    if all(not v.get("success", True) for v in results.values()):
        return jsonify({
            "success": False,
            "message": "Logs are still insufficient to run a proper analysis. Come back later!",
            "results": results
        })

    return jsonify({"success": True, "results": results})

if __name__ == '__main__':
    app.run(port=5001, host='0.0.0.0')