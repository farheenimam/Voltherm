from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class PolygonPoint(BaseModel):
    lat: float
    lng: float

class ScreenSiteRequest(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None
    polygon_aoi: Optional[List[PolygonPoint]] = None

class ScreenSiteResponse(BaseModel):
    location: Dict[str, Any]
    tss_score: int
    risk_level: str
    breakdown: Dict[str, Any]
    recommendation: Optional[str] = None
    verdict: str
    sources: Dict[str, Any]
    latency_ms: ints