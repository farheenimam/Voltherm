import asyncio
import uuid
import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from database import TaskRecord
import httpx

AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:4000")

async def call_agent(agent: str, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Call the external Node agent service and return its JSON response.
    Falls back to a local mock on error.
    """
    url = AGENT_SERVICE_URL.rstrip('/') + '/agent/run'
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"agent": agent, "prompt": prompt, "context": context})
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        # Fallback mock response (keeps behavior stable if agent service is down)
        return {"status": "ok", "agent": agent or "default", "output": f"[fallback] {agent}: processed prompt", "error": str(e)}

class AgentOrchestrator:
    def __init__(self):
        # older in-process agents are no longer primary; orchestration calls external agent service
        pass

    async def run_pipeline(self, agent_id: str, prompt: str, context: Dict[str, Any], db: Session):
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        steps = []

        # Run analysis agent via Node service
        analysis = await call_agent("analysis", prompt, context)
        steps.append({"step_name": "analysis", "status": analysis.get("status", "ok"), "output": analysis.get("output")})

        # Run report agent via Node service (use analysis output as context)
        report = await call_agent("report", prompt, {"previous_output": analysis.get("output")})
        steps.append({"step_name": "report", "status": report.get("status", "ok"), "output": report.get("output")})

        final_output = report.get("output")

        # Persist task record (best-effort)
        try:
            db_record = TaskRecord(
                task_id=task_id,
                agent_id=agent_id,
                prompt=prompt,
                status="success",
                final_output=final_output
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)
        except Exception:
            # Non-fatal: do not block orchestration on DB errors
            pass

        return {
            "task_id": task_id,
            "agent_id": agent_id,
            "status": "success",
            "steps": steps,
            "final_output": final_output
        }