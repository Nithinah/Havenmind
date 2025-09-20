from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models.sanctuary import (
    Story, JournalEntry, SanctuaryElement,
    StoryCreate, StoryResponse
)
from app.services import story_service
from app.services.image_generation_service import image_generation_service
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/story", tags=["story"])

# Request model for story image generation
class StoryImageRequest(BaseModel):
    story_content: str
    story_title: str = ""
    style: str = "fantasy-art"
    theme: str = "adventure"

@router.post("/generate", response_model=StoryResponse)
async def generate_story(
    story_request: StoryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate a therapeutic story based on user's sanctuary context."""
    try:
        # Get sanctuary context
        sanctuary_context = await get_sanctuary_context_for_story(
            db, story_request.session_id
        )
        
        # Generate story
        story_data = await story_service.generate_therapeutic_story(
            sanctuary_context, 
            story_request.style, 
            story_request.theme
        )
        
        # Create story record
        story = Story(
            session_id=story_request.session_id,
            title=story_data["title"],
            content=story_data["content"],
            style=story_data["style"],
            theme=story_data["theme"],
            reading_time=story_data["reading_time"],
            sanctuary_context=sanctuary_context,
            emotion_context=sanctuary_context.get("dominant_emotion", "neutral")
        )
        
        db.add(story)
        db.commit()
        
        return StoryResponse.from_orm(story)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error generating story: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate story")

@router.post("/generate-image")
async def generate_story_image(
    image_request: StoryImageRequest,
    db: Session = Depends(get_db)
):
    """Generate background image for story segment."""
    try:
        # Generate story-specific image
        image_url = await image_generation_service.generate_story_image(
            story_content=image_request.story_content,
            story_title=image_request.story_title,
            style=image_request.style,
            theme=image_request.theme
        )
        
        if not image_url:
            logger.error("Failed to generate story image")
            raise HTTPException(status_code=500, detail="Failed to generate image")
        
        return {
            "image_url": image_url,
            "status": "success",
            "style": image_request.style,
            "theme": image_request.theme
        }
        
    except Exception as e:
        logger.error(f"Error generating story image: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate story image")

@router.get("/history/{session_id}", response_model=List[StoryResponse])
async def get_story_history(
    session_id: str,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get story history for a session."""
    try:
        stories = db.query(Story).filter(
            Story.session_id == session_id
        ).order_by(desc(Story.created_at)).offset(offset).limit(limit).all()
        
        return [StoryResponse.from_orm(story) for story in stories]
        
    except Exception as e:
        logger.error(f"Error getting story history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get story history")

@router.get("/styles")
async def get_story_styles():
    """Get available story styles."""
    return {
        "styles": [
            {
                "id": "allegory",
                "name": "Allegory",
                "description": "Symbolic stories that mirror your emotional journey with metaphorical characters and situations."
            },
            {
                "id": "fairy_tale", 
                "name": "Fairy Tale",
                "description": "Magical stories with enchanted elements, wise creatures, and transformative adventures."
            },
            {
                "id": "meditation",
                "name": "Meditation",
                "description": "Contemplative narratives that guide you through peaceful inner journeys and mindful reflection."
            },
            {
                "id": "adventure", 
                "name": "Adventure",
                "description": "Uplifting tales of courage and discovery that mirror your personal growth journey."
            },
            {
                "id": "wisdom",
                "name": "Wisdom Story", 
                "description": "Ancient parable-style stories that share timeless insights about healing and growth."
            }
        ]
    }

@router.get("/themes")
async def get_story_themes():
    """Get available story themes."""
    return {
        "themes": [
            {
                "id": "overcoming_challenges",
                "name": "Overcoming Challenges",
                "description": "Stories about resilience, strength, and rising above difficulties."
            },
            {
                "id": "transformation_and_growth",
                "name": "Transformation & Growth", 
                "description": "Tales of personal evolution, change, and reaching your potential."
            },
            {
                "id": "finding_inner_light",
                "name": "Finding Inner Light",
                "description": "Stories about discovering joy, hope, and the bright spots in life."
            },
            {
                "id": "connection_and_belonging",
                "name": "Connection & Belonging",
                "description": "Narratives about relationships, community, and finding your place."
            },
            {
                "id": "finding_peace_in_uncertainty",
                "name": "Peace in Uncertainty", 
                "description": "Stories about finding calm and acceptance amid life's unknowns."
            },
            {
                "id": "the_healing_journey",
                "name": "The Healing Journey",
                "description": "Tales of recovery, self-care, and the process of becoming whole."
            },
            {
                "id": "present_moment_awareness",
                "name": "Present Moment Awareness",
                "description": "Stories about mindfulness, being here now, and finding peace in the present."
            },
            {
                "id": "discovering_inner_wisdom",
                "name": "Discovering Inner Wisdom",
                "description": "Narratives about trusting yourself and accessing your inner knowledge."
            }
        ]
    }

@router.delete("/{story_id}")
async def delete_story(story_id: int, db: Session = Depends(get_db)):
    """Delete a story."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        
        db.delete(story)
        db.commit()
        
        return {"message": "Story deleted successfully"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting story: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete story")

@router.get("/recommend/{session_id}")
async def get_story_recommendation(session_id: str, db: Session = Depends(get_db)):
    """Get personalized story recommendation based on user's recent emotional patterns."""
    try:
        # Get recent emotional context
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).limit(10).all()
        
        if not recent_entries:
            # Default recommendation for new users
            return {
                "recommended_style": "fairy_tale",
                "recommended_theme": "discovering_inner_wisdom",
                "reason": "Perfect for beginning your healing journey with gentle wisdom and wonder."
            }
        
        # Analyze recent emotions
        recent_emotions = [entry.emotion for entry in recent_entries]
        recent_sentiments = [entry.sentiment_score for entry in recent_entries]
        avg_sentiment = sum(recent_sentiments) / len(recent_sentiments)
        
        # Determine recommendations
        recommendation = _determine_story_recommendation(recent_emotions, avg_sentiment)
        
        return recommendation
        
    except Exception as e:
        logger.error(f"Error getting story recommendation: {e}")
        raise HTTPException(status_code=500, detail="Failed to get story recommendation")

async def get_sanctuary_context_for_story(db: Session, session_id: str) -> Dict[str, Any]:
    """Get comprehensive sanctuary context for story generation."""
    try:
        # Get recent journal entries
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).limit(20).all()
        
        # Get sanctuary elements
        sanctuary_elements = db.query(SanctuaryElement).filter(
            SanctuaryElement.session_id == session_id
        ).all()
        
        # Extract emotions and themes
        recent_emotions = []
        identified_themes = set()
        sentiment_scores = []
        
        for entry in recent_entries:
            recent_emotions.append(entry.emotion)
            sentiment_scores.append(entry.sentiment_score)
            
            if entry.analyzed_themes:
                themes = entry.analyzed_themes.get("themes", [])
                identified_themes.update(themes)
        
        # Calculate sentiment trend
        if sentiment_scores:
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            if avg_sentiment > 0.3:
                sentiment_trend = "positive"
            elif avg_sentiment < -0.3:
                sentiment_trend = "negative"  
            else:
                sentiment_trend = "neutral"
        else:
            sentiment_trend = "neutral"
        
        # Get dominant emotion
        if recent_emotions:
            emotion_counts = {}
            for emotion in recent_emotions:
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            dominant_emotion = max(emotion_counts, key=emotion_counts.get)
        else:
            dominant_emotion = "neutral"
        
        # Format sanctuary elements for story context
        element_data = []
        for element in sanctuary_elements:
            element_data.append({
                "element_type": element.element_type,
                "emotion": element.emotion,
                "sentiment_score": element.sentiment_score,
                "created_at": element.created_at.isoformat()
            })
        
        return {
            "session_id": session_id,
            "recent_emotions": recent_emotions[-10:],  # Last 10 emotions
            "identified_themes": list(identified_themes),
            "sentiment_trend": sentiment_trend,
            "dominant_emotion": dominant_emotion,
            "sanctuary_elements": element_data,
            "total_elements": len(element_data),
            "avg_sentiment": avg_sentiment if sentiment_scores else 0.0,
            "journal_entry_count": len(recent_entries)
        }
        
    except Exception as e:
        logger.error(f"Error getting sanctuary context for story: {e}")
        return {
            "session_id": session_id,
            "recent_emotions": [],
            "identified_themes": [],
            "sentiment_trend": "neutral",
            "dominant_emotion": "neutral",
            "sanctuary_elements": [],
            "total_elements": 0,
            "avg_sentiment": 0.0,
            "journal_entry_count": 0
        }

def _determine_story_recommendation(recent_emotions: List[str], avg_sentiment: float) -> Dict[str, str]:
    """Determine personalized story recommendation based on emotional patterns."""
    
    # Count emotion types
    positive_emotions = ["joy", "love", "gratitude", "hope", "contentment", "calm", "peace"]
    negative_emotions = ["sadness", "anger", "anxiety", "fear", "disappointment", "frustration"]
    
    positive_count = sum(1 for emotion in recent_emotions if emotion in positive_emotions)
    negative_count = sum(1 for emotion in recent_emotions if emotion in negative_emotions)
    
    # Determine recommendation based on patterns
    if negative_count > positive_count and avg_sentiment < -0.2:
        # User is struggling - recommend healing themes
        if "anxiety" in recent_emotions or "fear" in recent_emotions:
            return {
                "recommended_style": "meditation",
                "recommended_theme": "finding_peace_in_uncertainty", 
                "reason": "Gentle meditation stories can help calm anxiety and bring peace to uncertain times."
            }
        else:
            return {
                "recommended_style": "wisdom",
                "recommended_theme": "the_healing_journey",
                "reason": "Wisdom stories offer guidance and hope during challenging times."
            }
    
    elif positive_count > negative_count and avg_sentiment > 0.2:
        # User is doing well - recommend growth themes
        return {
            "recommended_style": "adventure",
            "recommended_theme": "transformation_and_growth",
            "reason": "Adventure stories can inspire you to continue growing and reaching new heights."
        }
    
    elif "anger" in recent_emotions or "frustration" in recent_emotions:
        # User showing anger - recommend resilience themes
        return {
            "recommended_style": "allegory", 
            "recommended_theme": "overcoming_challenges",
            "reason": "Allegorical stories can help you process difficult emotions and find strength."
        }
    
    elif "gratitude" in recent_emotions or "love" in recent_emotions:
        # User showing positive emotions - celebrate with uplifting themes
        return {
            "recommended_style": "fairy_tale",
            "recommended_theme": "finding_inner_light",
            "reason": "Magical fairy tales can amplify your positive energy and sense of wonder."
        }
    
    else:
        # Balanced or neutral - recommend mindfulness
        return {
            "recommended_style": "meditation",
            "recommended_theme": "present_moment_awareness", 
            "reason": "Meditation stories can help you find balance and appreciate the present moment."
        }
    
@router.get("/styles")
async def get_story_styles():
    """Get available story styles."""
    return {
        "styles": [
            {
                "id": "allegory",
                "name": "Allegory",
                "description": "Symbolic stories that mirror your emotional journey with metaphorical characters and situations."
            },
            {
                "id": "fairy_tale", 
                "name": "Fairy Tale",
                "description": "Magical stories with enchanted elements, wise creatures, and transformative adventures."
            },
            {
                "id": "meditation",
                "name": "Meditation",
                "description": "Contemplative narratives that guide you through peaceful inner journeys and mindful reflection."
            },
            {
                "id": "adventure", 
                "name": "Adventure",
                "description": "Uplifting tales of courage and discovery that mirror your personal growth journey."
            },
            {
                "id": "wisdom",
                "name": "Wisdom Story", 
                "description": "Ancient parable-style stories that share timeless insights about healing and growth."
            }
        ]
    }

# ADD THIS ENDPOINT - Frontend calls this to get story themes
@router.get("/themes")
async def get_story_themes():
    """Get available story themes."""
    return {
        "themes": [
            {
                "id": "overcoming_challenges",
                "name": "Overcoming Challenges",
                "description": "Stories about resilience, strength, and rising above difficulties."
            },
            {
                "id": "transformation_and_growth",
                "name": "Transformation & Growth", 
                "description": "Tales of personal evolution, change, and reaching your potential."
            },
            {
                "id": "finding_inner_light",
                "name": "Finding Inner Light",
                "description": "Stories about discovering joy, hope, and the bright spots in life."
            },
            {
                "id": "connection_and_belonging",
                "name": "Connection & Belonging",
                "description": "Narratives about relationships, community, and finding your place."
            },
            {
                "id": "finding_peace_in_uncertainty",
                "name": "Peace in Uncertainty", 
                "description": "Stories about finding calm and acceptance amid life's unknowns."
            },
            {
                "id": "the_healing_journey",
                "name": "The Healing Journey",
                "description": "Tales of recovery, self-care, and the process of becoming whole."
            },
            {
                "id": "present_moment_awareness",
                "name": "Present Moment Awareness",
                "description": "Stories about mindfulness, being here now, and finding peace in the present."
            },
            {
                "id": "discovering_inner_wisdom",
                "name": "Discovering Inner Wisdom",
                "description": "Narratives about trusting yourself and accessing your inner knowledge."
            }
        ]
    }

# ADD THIS ENDPOINT - Frontend calls this to get personalized recommendations
@router.get("/recommend/{session_id}")
async def get_story_recommendation(session_id: str, db: Session = Depends(get_db)):
    """Get personalized story recommendation based on user's recent emotional patterns."""
    try:
        # Get recent emotional context
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).limit(10).all()
        
        if not recent_entries:
            # Default recommendation for new users
            return {
                "recommended_style": "fairy_tale",
                "recommended_theme": "discovering_inner_wisdom",
                "reason": "Perfect for beginning your healing journey with gentle wisdom and wonder."
            }
        
        # Analyze recent emotions
        recent_emotions = [entry.emotion for entry in recent_entries]
        recent_sentiments = [entry.sentiment_score for entry in recent_entries]
        avg_sentiment = sum(recent_sentiments) / len(recent_sentiments)
        
        # Determine recommendations using the existing logic
        recommendation = _determine_story_recommendation(recent_emotions, avg_sentiment)
        
        return recommendation
        
    except Exception as e:
        logger.error(f"Error getting story recommendation: {e}")
        raise HTTPException(status_code=500, detail="Failed to get story recommendation")