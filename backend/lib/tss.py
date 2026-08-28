"""
Deterministic Thermal Site Score (TSS) calculation.

Driven only by the inputs the frontend form actually collects (surface
type, canopy/tree coverage, charger count, NEVI funding flag). No
dependency on FortyGuard or an LLM, so it always returns instantly.
Swap this for real heat/shade/financial agent calls later.
"""

SURFACE_HEAT_FACTOR = {
    "asphalt": 1.0,
    "mixed": 0.8,
    "concrete": 0.65,
    "gravel": 0.55,
}


def _clamp(n, lo, hi):
    return max(lo, min(hi, n))


def compute_tss(surface_type, canopy_pct, tree_pct, charger_count, nevi_funding):
    heat_factor = SURFACE_HEAT_FACTOR.get(surface_type, 1.0)
    heat_penalty = _clamp(heat_factor * 70, 0, 100)

    shade_coverage = _clamp((canopy_pct * 0.6 + tree_pct * 0.4), 0, 100)
    shade_penalty = _clamp((100 - shade_coverage) * 0.9, 0, 100)

    density_penalty = _clamp((charger_count / 20) * 60, 0, 100)
    funding_relief = 15 if nevi_funding else 0
    environmental_penalty = _clamp(density_penalty - funding_relief, 0, 100)

    tss = _clamp(100 - heat_penalty * 0.4 - shade_penalty * 0.35 - environmental_penalty * 0.25, 0, 100)
    tss = round(tss, 1)

    if tss >= 75:
        band = {"label": "Low Risk", "color": "#39D97A"}
        risk_level = "Low"
    elif tss >= 55:
        band = {"label": "Moderate Risk", "color": "#E0A93B"}
        risk_level = "Moderate"
    else:
        band = {"label": "High Risk", "color": "#E05C4F"}
        risk_level = "High"

    breakdown = {
        "heat": {"subscore": round(100 - heat_penalty, 1)},
        "shade": {"subscore": round(100 - shade_penalty, 1)},
        "financial": {"subscore": round(100 - environmental_penalty, 1)},
    }

    recommendations = []
    if shade_penalty > 40:
        recommendations.append({"action": "Add canopy or tree coverage over parking/charging bays to cut peak surface heat."})
    if heat_penalty > 50:
        recommendations.append({"action": "Consider lighter-colored or reflective paving to reduce surface heat absorption."})
    if environmental_penalty > 40:
        recommendations.append({"action": "Phase charger rollout or add active cooling to manage derating risk during peak demand."})
    if not recommendations:
        recommendations.append({"action": "No urgent mitigations identified — monitor conditions seasonally."})

    summary = (
        f"This site scores {tss}/100 ({risk_level} risk). "
        f"Shade coverage and surface type are the primary drivers of thermal exposure here."
    )

    verdict = "PASS" if tss >= 40 else "FAIL"

    return {
        "tss_score": tss,
        "risk_level": risk_level,
        "band": band,
        "breakdown": breakdown,
        "recommendations": recommendations,
        "summary": summary,
        "verdict": verdict,
    }
