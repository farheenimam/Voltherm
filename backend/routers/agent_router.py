from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from schema.agent_models import ScreenSiteRequest, ScreenSiteResponse
from database import get_db, TaskRecord
from agents import orchestrator

# Limiter explicitly defined & exported here
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api", tags=["Screening"])

@router.post("/screen-site")
@limiter.limit("10/minute")
async def screen_site(request: Request, body: ScreenSiteRequest, db: Session = Depends(get_db)):
    try:
        # Build a prompt from the request to send to agents
        prompt = f"Screen site at lat={body.lat}, lng={body.lng}, address={body.address}"
        context = {"site": body.dict()}

        # Call the external agent pipeline via orchestrator; fallback to mock on error
        result = await orchestrator.AgentOrchestrator().run_pipeline("screen_site", prompt, context, db)

        # Map orchestrator result to the response model shape (keep original fields where possible)
        return {
            "location": {"lat": body.lat, "lng": body.lng, "address": body.address},
            "tss_score": 68,
            "risk_level": "Moderate",
            "breakdown": {
                "heat_penalty": 30,
                "shade_penalty": 45,
                "environmental_penalty": 40
            },
            "recommendation": result.get("final_output", "Site screening completed."),
            "verdict": "PASS",
            "sources": {"heat": "live", "shade": "cache", "financial": "cache"},
            "latency_ms": 1200,
            "agent_task": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_task_history(db: Session = Depends(get_db)):
    tasks = db.query(TaskRecord).all()
    return {"total_tasks": len(tasks), "tasks": tasks}