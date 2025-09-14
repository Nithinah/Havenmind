from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from app.database import Base
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SanctuaryElement(Base):
    __tablename__ = "sanctuary_elements"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    element_type = Column(String, nullable=False)  # tree, flower, crystal, etc.
    x_position = Column(Float, nullable=False)
    y_position = Column(Float, nullable=False)
    z_position = Column(Float, default=0.0)
    size = Column(Float, default=1.0)
    color = Column(String, nullable=False)
    emotion = Column(String, nullable=False)
    sentiment_score = Column(Float, nullable=False)
    journal_entry = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    image_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    emotion = Column(String, nullable=False)
    sentiment_score = Column(Float, nullable=False)
    analyzed_themes = Column(JSON, nullable=True)
    companion_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Story(Base):
    __tablename__ = "stories"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    style = Column(String, nullable=False)  # allegory, fairy_tale, etc.
    theme = Column(String, nullable=False)
    reading_time = Column(Integer, nullable=False)  # in minutes
    sanctuary_context = Column(JSON, nullable=True)
    emotion_context = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserSkill(Base):
    __tablename__ = "user_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    skill_name = Column(String, nullable=False)
    mastery_level = Column(Integer, default=0)
    experience_points = Column(Integer, default=0)
    times_practiced = Column(Integer, default=0)
    unlocked = Column(Boolean, default=False)
    last_practiced = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SkillSession(Base):
    __tablename__ = "skill_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    skill_name = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    completion_rating = Column(Integer, nullable=True)  # 1-5 stars
    notes = Column(Text, nullable=True)
    emotions_before = Column(JSON, nullable=True)
    emotions_after = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic Models for API
class SanctuaryElementCreate(BaseModel):
    session_id: str
    element_type: str
    x_position: float
    y_position: float
    z_position: float = 0.0
    size: float = 1.0
    color: str
    emotion: str
    sentiment_score: float
    journal_entry: str
    image_prompt: Optional[str] = None

class SanctuaryElementResponse(BaseModel):
    id: int
    session_id: str
    element_type: str
    x_position: float
    y_position: float
    z_position: float
    size: float
    color: str
    emotion: str
    sentiment_score: float
    journal_entry: str
    image_url: Optional[str]
    image_prompt: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class JournalEntryCreate(BaseModel):
    content: str
    session_id: Optional[str] = None

class JournalEntryResponse(BaseModel):
    id: int
    session_id: str
    content: str
    emotion: str
    sentiment_score: float
    analyzed_themes: Optional[Dict[str, Any]]
    companion_response: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class StoryCreate(BaseModel):
    session_id: str
    style: str = "allegory"
    theme: Optional[str] = None

class StoryResponse(BaseModel):
    id: int
    session_id: str
    title: str
    content: str
    style: str
    theme: str
    reading_time: int
    sanctuary_context: Optional[Dict[str, Any]]
    emotion_context: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SkillResponse(BaseModel):
    skill_name: str
    mastery_level: int
    experience_points: int
    times_practiced: int
    unlocked: bool
    last_practiced: Optional[datetime]
    
    class Config:
        from_attributes = True

class SkillSessionCreate(BaseModel):
    session_id: str
    skill_name: str
    duration_minutes: int
    completion_rating: Optional[int] = None
    notes: Optional[str] = None
    emotions_before: Optional[Dict[str, Any]] = None
    emotions_after: Optional[Dict[str, Any]] = None

class SanctuaryStats(BaseModel):
    total_elements: int
    emotion_distribution: Dict[str, int]
    dominant_emotion: str
    average_sentiment: float
    session_duration: int  # in days
    elements_this_week: int