import datetime
import uuid

from sqlalchemy import create_engine, Column, String, Text, DateTime, Float, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./agents.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TaskRecord(Base):
    """Legacy generic-agent task log — kept for /api/history, unrelated to site screening."""
    __tablename__ = "task_records"

    task_id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, index=True)
    prompt = Column(Text)
    status = Column(String)
    final_output = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Site(Base):
    """A screened candidate EV charging site, with its computed TSS result."""
    __tablename__ = "sites"

    id = Column(String, primary_key=True, index=True, default=lambda: uuid.uuid4().hex)
    site_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    surface_type = Column(String, default="asphalt")
    canopy_coverage_pct = Column(Float, default=0)
    tree_coverage_pct = Column(Float, default=0)
    estimated_charger_count = Column(Integer, default=4)
    nevi_funding = Column(Boolean, default=False)

    tss_score = Column(Float, nullable=False)
    band_label = Column(String, nullable=False)
    band_color = Column(String, nullable=False)
    breakdown_json = Column(Text, nullable=False)          # JSON-encoded {key: {subscore}}
    summary = Column(Text, nullable=False)
    recommendations_json = Column(Text, nullable=False)    # JSON-encoded [{action}]
    verdict = Column(String, default="PASS")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()