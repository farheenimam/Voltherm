from typing import Optional, List, Dict
from pydantic import BaseModel


class ScreenSiteRequest(BaseModel):
    """Mirrors exactly what frontend/src/components/SiteScorecard.jsx submits."""
    siteName: str
    address: str
    latitude: float
    longitude: float
    surfaceType: str = "asphalt"
    canopyCoveragePct: float = 0
    treeCoveragePct: float = 0
    estimatedChargerCount: int = 4
    nevifunding: bool = False


class Band(BaseModel):
    label: str
    color: str


class Subscore(BaseModel):
    subscore: float


class TSS(BaseModel):
    score: float
    band: Band
    breakdown: Dict[str, Subscore]


class Recommendation(BaseModel):
    action: str


class CritiqueResult(BaseModel):
    summary: str
    prioritizedRecommendations: List[Recommendation] = []


class ScreenSiteResponse(BaseModel):
    id: str
    siteName: str
    address: str
    latitude: float
    longitude: float
    tss: TSS
    critiqueResult: CritiqueResult
    verdict: str
    partial_data: bool = False
    latency_ms: int


class SiteListItem(BaseModel):
    id: str
    siteName: str
    address: str
    latitude: float
    longitude: float
    tss: TSS
    critiqueResult: CritiqueResult
    verdict: str
    partial_data: bool = False


class SiteListResponse(BaseModel):
    sites: List[SiteListItem]