from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from schema.agent_models import ScreenSiteRequest, ScreenSiteResponse
from database import get_db, TaskRecord

# Limiter explicitly defined & exported here
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api", tags=["Screening"])

@router.post("/screen-site", response_model=ScreenSiteResponse)
@limiter.limit("10/minute")
async def screen_site(request: Request, body: ScreenSiteRequest, db: Session = Depends(get_db)):
    try:
        # Site screening mock/agent processing logic
        return {
            "location": {"lat": body.lat, "lng": body.lng, "address": body.address},
            "tss_score": 68,
            "risk_level": "Moderate",
            "breakdown": {
                "heat_penalty": 30,
                "shade_penalty": 45,
                "environmental_penalty": 40
            },
            "recommendation": "Site screening completed successfully.",
            "verdict": "PASS",
            "sources": {"heat": "live", "shade": "cache", "financial": "cache"},
            "latency_ms": 1200
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_task_history(db: Session = Depends(get_db)):
    tasks = db.query(TaskRecord).all()
    return {"total_tasks": len(tasks), "tasks": tasks}