import asyncio
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session
from database import TaskRecord

class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    async def execute(self, prompt: str, context: Dict[str, Any]) -> str:
        raise NotImplementedError

class AnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__("AnalysisAgent")

    async def execute(self, prompt: str, context: Dict[str, Any]) -> str:
        await asyncio.sleep(1)
        return f"[Analysis Complete]: Processed query '{prompt}'."

class ReportAgent(BaseAgent):
    def __init__(self):
        super().__init__("ReportAgent")

    async def execute(self, prompt: str, context: Dict[str, Any]) -> str:
        await asyncio.sleep(1)
        return f"[Report Generated]: Summarized results for task."

class AgentOrchestrator:
    def __init__(self):
        self.agents = {
            "analysis_agent": AnalysisAgent(),
            "report_agent": ReportAgent()
        }

    async def run_pipeline(self, agent_id: str, prompt: str, context: Dict[str, Any], db: Session):
        try:
            return await asyncio.wait_for(self._execute_workflow(agent_id, prompt, context, db), timeout=10.0)
        except asyncio.TimeoutError:
            raise Exception("Agent execution timed out due to system load.")

    async def _execute_workflow(self, agent_id: str, prompt: str, context: Dict[str, Any], db: Session):
        results = []
        task_id = f"task_{uuid.uuid4().hex[:8]}"

        # Step 1: Execute target agent
        agent = self.agents.get(agent_id, self.agents["analysis_agent"])
        analysis_out = await agent.execute(prompt, context)
        results.append({"step_name": agent.name, "status": "completed", "output": analysis_out})

        # Step 2: Execute report generation agent
        report_agent = self.agents["report_agent"]
        report_out = await report_agent.execute(prompt, {"previous_output": analysis_out})
        results.append({"step_name": report_agent.name, "status": "completed", "output": report_out})

        # Step 3: Database Persist Logic
        db_record = TaskRecord(
            task_id=task_id,
            agent_id=agent_id,
            prompt=prompt,
            status="success",
            final_output=report_out
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        return {
            "task_id": task_id,
            "agent_id": agent_id,
            "status": "success",
            "steps": results,
            "final_output": report_out
        }