import json
import time
import uuid

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from schema.agent_models import ScreenSiteRequest, ScreenSiteResponse, SiteListResponse
from database import get_db, Site, TaskRecord
from lib.tss import compute_tss

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api", tags=["Screening"])


def _site_to_dict(site: Site) -> dict:
    return {
        "id": site.id,
        "siteName": site.site_name,
        "address": site.address,
        "latitude": site.latitude,
        "longitude": site.longitude,
        "tss": {
            "score": site.tss_score,
            "band": {"label": site.band_label, "color": site.band_color},
            "breakdown": json.loads(site.breakdown_json),
        },
        "critiqueResult": {
            "summary": site.summary,
            "prioritizedRecommendations": json.loads(site.recommendations_json),
        },
        "verdict": site.verdict,
        "partial_data": False,
    }


@router.get("/health")
async def health():
    return {"ok": True}


@router.post("/screen-site", response_model=ScreenSiteResponse)
@limiter.limit("10/minute")
async def screen_site(request: Request, body: ScreenSiteRequest, db: Session = Depends(get_db)):
    started = time.time()
    try:
        result = compute_tss(
            body.surfaceType, body.canopyCoveragePct, body.treeCoveragePct,
            body.estimatedChargerCount, body.nevifunding,
        )
        site = Site(
            id=uuid.uuid4().hex,
            site_name=body.siteName,
            address=body.address,
            latitude=body.latitude,
            longitude=body.longitude,
            surface_type=body.surfaceType,
            canopy_coverage_pct=body.canopyCoveragePct,
            tree_coverage_pct=body.treeCoveragePct,
            estimated_charger_count=body.estimatedChargerCount,
            nevi_funding=body.nevifunding,
            tss_score=result["tss_score"],
            band_label=result["band"]["label"],
            band_color=result["band"]["color"],
            breakdown_json=json.dumps(result["breakdown"]),
            summary=result["summary"],
            recommendations_json=json.dumps(result["recommendations"]),
            verdict=result["verdict"],
        )
        db.add(site)
        db.commit()
        db.refresh(site)

        payload = _site_to_dict(site)
        payload["latency_ms"] = int((time.time() - started) * 1000)
        return payload
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/screen-site", response_model=SiteListResponse)
async def list_sites(db: Session = Depends(get_db)):
    sites = db.query(Site).order_by(Site.created_at.desc()).all()
    return {"sites": [_site_to_dict(s) for s in sites]}


@router.get("/screen-site/{site_id}")
async def get_site(site_id: str, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return _site_to_dict(site)


@router.get("/screen-site/{site_id}/report")
async def get_site_report(site_id: str, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    breakdown = json.loads(site.breakdown_json)
    recs = json.loads(site.recommendations_json)
    lines = [
        "VOLTHERM THERMAL SITE REPORT", "=============================",
        f"Site: {site.site_name}", f"Address: {site.address}",
        f"Coordinates: {site.latitude}, {site.longitude}", "",
        f"Thermal Site Score: {site.tss_score} ({site.band_label})",
        f"Verdict: {site.verdict}", "", "Breakdown:",
    ]
    for key, val in breakdown.items():
        lines.append(f"  - {key}: {val['subscore']}")
    lines += ["", "Summary:", site.summary, "", "Recommended mitigations:"]
    for r in recs:
        lines.append(f"  - {r['action']}")

    return PlainTextResponse(
        "\n".join(lines),
        headers={"Content-Disposition": f'attachment; filename="voltherm-report-{site.id}.txt"'},
    )


@router.get("/history")
async def get_task_history(db: Session = Depends(get_db)):
    tasks = db.query(TaskRecord).all()
    return {"total_tasks": len(tasks), "tasks": tasks}
