from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app.models.sanctuary import (
    SanctuaryElement, JournalEntry,
    SanctuaryElementCreate, SanctuaryElementResponse,
    JournalEntryCreate, JournalEntryResponse,
    SanctuaryStats
)
from app.services import (
    sentiment_service, image_generation_service, 
    companion_service, skills_service
)
from app.utils.helpers import (
    generate_session_id, sentiment_to_emotion, emotion_to_color,
    emotion_to_element_type, calculate_element_position, calculate_element_size,
    extract_themes_from_text
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sanctuary", tags=["sanctuary"])

@router.post("/journal-entry", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new journal entry and generate sanctuary element."""
    try:
        # Generate session ID if not provided
        session_id = entry_data.session_id or generate_session_id()
        
        # Analyze sentiment and emotion
        analysis = sentiment_service.analyze_sentiment(entry_data.content)
        
        primary_emotion = analysis["primary_emotion"]
        sentiment_score = analysis["sentiment_score"]
        themes = analysis["themes"]
        
        # Create journal entry record
        journal_entry = JournalEntry(
            session_id=session_id,
            content=entry_data.content,
            emotion=primary_emotion,
            sentiment_score=sentiment_score,
            analyzed_themes=analysis
        )
        db.add(journal_entry)
        db.flush()  # Get the ID
        
        # Generate companion response in background
        background_tasks.add_task(
            generate_companion_response_task,
            db, journal_entry.id, entry_data.content, 
            primary_emotion, sentiment_score, themes
        )
        
        # Create sanctuary element
        background_tasks.add_task(
            create_sanctuary_element_task,
            db, session_id, entry_data.content, 
            primary_emotion, sentiment_score
        )
        
        # Update skill unlocks
        background_tasks.add_task(
            update_skill_unlocks_task,
            db, session_id
        )
        
        db.commit()
        
        return JournalEntryResponse.from_orm(journal_entry)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating journal entry: {e}")
        raise HTTPException(status_code=500, detail="Failed to create journal entry")

async def generate_companion_response_task(
    db: Session, 
    journal_id: int,
    content: str,
    emotion: str, 
    sentiment_score: float,
    themes: List[str]
):
    """Background task to generate companion response."""
    try:
        # Get sanctuary context
        sanctuary_context = await get_sanctuary_context(db, journal_id)
        
        # Generate response
        response = await companion_service.generate_companion_response(
            content, emotion, sentiment_score, themes, sanctuary_context
        )
        
        # Update journal entry with response
        journal_entry = db.query(JournalEntry).filter(
            JournalEntry.id == journal_id
        ).first()
        
        if journal_entry:
            journal_entry.companion_response = response
            db.commit()
            
    except Exception as e:
        logger.error(f"Error generating companion response: {e}")

async def create_sanctuary_element_task(
    db: Session,
    session_id: str,
    journal_content: str,
    emotion: str,
    sentiment_score: float
):
    """Background task to create sanctuary element with image."""
    try:
        # Get existing elements for positioning
        existing_elements = db.query(SanctuaryElement).filter(
            SanctuaryElement.session_id == session_id
        ).all()
        
        existing_positions = [
            {"x_position": elem.x_position, "y_position": elem.y_position}
            for elem in existing_elements
        ]
        
        # Calculate element properties
        element_type = emotion_to_element_type(emotion, sentiment_score)
        color = emotion_to_color(emotion)
        x_pos, y_pos = calculate_element_position(existing_positions)
        size = calculate_element_size(sentiment_score)
        
        # Create sanctuary element
        element = SanctuaryElement(
            session_id=session_id,
            element_type=element_type,
            x_position=x_pos,
            y_position=y_pos,
            z_position=0.0,
            size=size,
            color=color,
            emotion=emotion,
            sentiment_score=sentiment_score,
            journal_entry=journal_content[:500]  # Truncate for storage
        )
        db.add(element)
        db.flush()
        
        # Generate image in background
        try:
            image_url = await image_generation_service.generate_sanctuary_image(
                element_type, emotion, journal_content
            )
            element.image_url = image_url
        except Exception as img_error:
            logger.error(f"Error generating image: {img_error}")
            # Continue without image
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Error creating sanctuary element: {e}")

async def update_skill_unlocks_task(db: Session, session_id: str):
    """Background task to update skill unlocks."""
    try:
        # Get emotion history
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).limit(20).all()
        
        emotion_history = [
            {
                "emotion": entry.emotion,
                "sentiment_score": entry.sentiment_score,
                "themes": entry.analyzed_themes.get("themes", []) if entry.analyzed_themes else []
            }
            for entry in recent_entries
        ]
        
        journal_entries = [
            {"content": entry.content, "themes": entry.analyzed_themes.get("themes", []) if entry.analyzed_themes else []}
            for entry in recent_entries
        ]
        
        # Update unlocks
        await skills_service.update_skill_unlocks(
            db, session_id, emotion_history, journal_entries
        )
        
    except Exception as e:
        logger.error(f"Error updating skill unlocks: {e}")

@router.get("/elements/{session_id}", response_model=List[SanctuaryElementResponse])
async def get_sanctuary_elements(session_id: str, db: Session = Depends(get_db)):
    """Get all sanctuary elements for a session."""
    try:
        elements = db.query(SanctuaryElement).filter(
            SanctuaryElement.session_id == session_id
        ).order_by(SanctuaryElement.created_at).all()
        
        return [SanctuaryElementResponse.from_orm(element) for element in elements]
        
    except Exception as e:
        logger.error(f"Error getting sanctuary elements: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sanctuary elements")

@router.get("/journal/{session_id}", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    session_id: str, 
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get journal entries for a session."""
    try:
        entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).offset(offset).limit(limit).all()
        
        return [JournalEntryResponse.from_orm(entry) for entry in entries]
        
    except Exception as e:
        logger.error(f"Error getting journal entries: {e}")
        raise HTTPException(status_code=500, detail="Failed to get journal entries")

@router.get("/stats/{session_id}", response_model=SanctuaryStats)
async def get_sanctuary_stats(session_id: str, db: Session = Depends(get_db)):
    """Get sanctuary statistics for a session."""
    try:
        # Total elements
        total_elements = db.query(func.count(SanctuaryElement.id)).filter(
            SanctuaryElement.session_id == session_id
        ).scalar() or 0
        
        # Emotion distribution
        emotion_counts = db.query(
            SanctuaryElement.emotion,
            func.count(SanctuaryElement.id).label('count')
        ).filter(
            SanctuaryElement.session_id == session_id
        ).group_by(SanctuaryElement.emotion).all()
        
        emotion_distribution = {emotion: count for emotion, count in emotion_counts}
        dominant_emotion = max(emotion_distribution.items(), key=lambda x: x[1])[0] if emotion_distribution else "neutral"
        
        # Average sentiment
        avg_sentiment = db.query(func.avg(SanctuaryElement.sentiment_score)).filter(
            SanctuaryElement.session_id == session_id
        ).scalar() or 0.0
        
        # Session duration (days)
        first_element = db.query(SanctuaryElement).filter(
            SanctuaryElement.session_id == session_id
        ).order_by(SanctuaryElement.created_at).first()
        
        session_duration = 1
        if first_element:
            duration_delta = datetime.utcnow() - first_element.created_at
            session_duration = max(1, duration_delta.days)
        
        # Elements this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        elements_this_week = db.query(func.count(SanctuaryElement.id)).filter(
            SanctuaryElement.session_id == session_id,
            SanctuaryElement.created_at >= week_ago
        ).scalar() or 0
        
        return SanctuaryStats(
            total_elements=total_elements,
            emotion_distribution=emotion_distribution,
            dominant_emotion=dominant_emotion,
            average_sentiment=round(avg_sentiment, 3),
            session_duration=session_duration,
            elements_this_week=elements_this_week
        )
        
    except Exception as e:
        logger.error(f"Error getting sanctuary stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sanctuary stats")

@router.delete("/elements/{element_id}")
async def delete_sanctuary_element(element_id: int, db: Session = Depends(get_db)):
    """Delete a sanctuary element."""
    try:
        element = db.query(SanctuaryElement).filter(
            SanctuaryElement.id == element_id
        ).first()
        
        if not element:
            raise HTTPException(status_code=404, detail="Element not found")
        
        db.delete(element)
        db.commit()
        
        return {"message": "Element deleted successfully"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting sanctuary element: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete element")

@router.get("/session/new")
async def create_new_session():
    """Create a new session ID."""
    try:
        session_id = generate_session_id()
        return {"session_id": session_id}
    except Exception as e:
        logger.error(f"Error creating new session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create new session")

async def get_sanctuary_context(db: Session, journal_id: int) -> Dict[str, Any]:
    """Get sanctuary context for companion responses."""
    try:
        journal_entry = db.query(JournalEntry).filter(
            JournalEntry.id == journal_id
        ).first()
        
        if not journal_entry:
            return {}
        
        # Get recent emotions
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == journal_entry.session_id
        ).order_by(desc(JournalEntry.created_at)).limit(10).all()
        
        recent_emotions = [entry.emotion for entry in recent_entries]
        
        # Get element count
        element_count = db.query(func.count(SanctuaryElement.id)).filter(
            SanctuaryElement.session_id == journal_entry.session_id
        ).scalar() or 0
        
        return {
            "element_count": element_count,
            "recent_emotions": recent_emotions,
            "session_id": journal_entry.session_id
        }
        
    except Exception as e:
        logger.error(f"Error getting sanctuary context: {e}")
        return {}