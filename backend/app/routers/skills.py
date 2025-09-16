from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging

from app.database import get_db
from app.models.sanctuary import (
    SkillResponse, SkillSessionCreate
)
from app.services import skills_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/skills", tags=["skills"])

@router.get("/{session_id}", response_model=List[SkillResponse])
async def get_user_skills(session_id: str, db: Session = Depends(get_db)):
    """Get all skills for a user with current progress."""
    try:
        skills = await skills_service.get_user_skills(db, session_id)
        return skills
        
    except Exception as e:
        logger.error(f"Error getting user skills: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user skills")

@router.post("/practice")
async def practice_skill(
    session_data: SkillSessionCreate,
    db: Session = Depends(get_db)
):
    """Record a skill practice session."""
    try:
        result = await skills_service.practice_skill(
            db=db,
            session_id=session_data.session_id,
            skill_name=session_data.skill_name,
            duration_minutes=session_data.duration_minutes,
            completion_rating=session_data.completion_rating,
            notes=session_data.notes,
            emotions_before=session_data.emotions_before,
            emotions_after=session_data.emotions_after
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to record practice"))
        
        return {
            "message": "Practice session recorded successfully",
            "experience_gained": result["experience_gained"],
            "total_experience": result["total_experience"],
            "level_up": result["level_up"],
            "new_level": result["new_level"],
            "times_practiced": result["times_practiced"]
        }
        
    except Exception as e:
        logger.error(f"Error recording skill practice: {e}")
        raise HTTPException(status_code=500, detail="Failed to record skill practice")

@router.get("/guidance/{skill_name}")
async def get_skill_guidance(
    skill_name: str,
    mastery_level: int = 0,
    current_emotion: Optional[str] = None,
    stress_level: Optional[str] = None,
    time_available: Optional[str] = None
):
    """Get detailed guidance for practicing a specific skill."""
    try:
        user_context = {}
        if current_emotion:
            user_context["current_emotion"] = current_emotion
        if stress_level:
            user_context["stress_level"] = stress_level
        if time_available:
            user_context["time_available"] = time_available
        
        guidance = await skills_service.get_skill_guidance(
            skill_name, mastery_level, user_context
        )
        
        return guidance
        
    except Exception as e:
        logger.error(f"Error getting skill guidance: {e}")
        raise HTTPException(status_code=500, detail="Failed to get skill guidance")

@router.get("/statistics/{session_id}")
async def get_skill_statistics(session_id: str, db: Session = Depends(get_db)):
    """Get comprehensive skill practice statistics."""
    try:
        stats = await skills_service.get_skill_statistics(db, session_id)
        return stats
        
    except Exception as e:
        logger.error(f"Error getting skill statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get skill statistics")

@router.get("/available/list")
async def get_available_skills():
    """Get list of all available skills with descriptions."""
    try:
        from app.utils.helpers import get_skill_description
        from app.config import settings
        
        skills_info = []
        for skill_name in settings.SKILLS_LIST:
            skill_info = get_skill_description(skill_name, 0)
            skills_info.append({
                "skill_name": skill_name,
                "display_name": skill_info["name"],
                "description": skill_info["description"],
                "category": _get_skill_category(skill_name),
                "difficulty": _get_skill_difficulty(skill_name),
                "benefits": _get_skill_benefits(skill_name)
            })
        
        return {"skills": skills_info}
        
    except Exception as e:
        logger.error(f"Error getting available skills: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available skills")

@router.post("/unlock/{session_id}")
async def force_unlock_skill(
    session_id: str,
    skill_name: str,
    db: Session = Depends(get_db)
):
    """Manually unlock a skill (for testing/admin purposes)."""
    try:
        from app.models.sanctuary import UserSkill
        
        # Get or create skill record
        skill = db.query(UserSkill).filter(
            UserSkill.session_id == session_id,
            UserSkill.skill_name == skill_name
        ).first()
        
        if not skill:
            skill = UserSkill(
                session_id=session_id,
                skill_name=skill_name,
                unlocked=True
            )
            db.add(skill)
        else:
            skill.unlocked = True
        
        db.commit()
        
        return {"message": f"Skill {skill_name} unlocked successfully"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error unlocking skill: {e}")
        raise HTTPException(status_code=500, detail="Failed to unlock skill")

@router.get("/recommendations/{session_id}")
async def get_skill_recommendations(session_id: str, db: Session = Depends(get_db)):
    """Get personalized skill recommendations based on user's emotional patterns."""
    try:
        from app.models.sanctuary import JournalEntry, UserSkill
        from sqlalchemy import desc
        
        # Get recent emotional patterns
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).limit(10).all()
        
        # Get user's current skills
        user_skills = db.query(UserSkill).filter(
            UserSkill.session_id == session_id,
            UserSkill.unlocked == True
        ).all()
        
        unlocked_skills = {skill.skill_name for skill in user_skills}
        recent_emotions = [entry.emotion for entry in recent_entries]
        
        recommendations = _generate_skill_recommendations(recent_emotions, unlocked_skills)
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        logger.error(f"Error getting skill recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get skill recommendations")

def _get_skill_category(skill_name: str) -> str:
    """Get category for a skill."""
    categories = {
        "mindful_breathing": "Mindfulness",
        "gratitude_practice": "Positive Psychology",
        "emotional_regulation": "Emotional Wellness",
        "self_compassion": "Self-Care",
        "grounding_techniques": "Anxiety Management", 
        "positive_visualization": "Mindfulness"
    }
    return categories.get(skill_name, "General Wellness")

def _get_skill_difficulty(skill_name: str) -> str:
    """Get difficulty level for a skill."""
    difficulties = {
        "mindful_breathing": "Beginner",
        "gratitude_practice": "Beginner",
        "grounding_techniques": "Beginner",
        "emotional_regulation": "Intermediate",
        "self_compassion": "Intermediate",
        "positive_visualization": "Intermediate"
    }
    return difficulties.get(skill_name, "Beginner")

def _get_skill_benefits(skill_name: str) -> List[str]:
    """Get key benefits for a skill."""
    benefits = {
        "mindful_breathing": [
            "Reduces anxiety and stress",
            "Improves focus and concentration",
            "Promotes relaxation",
            "Helps with emotional regulation"
        ],
        "gratitude_practice": [
            "Increases positive emotions",
            "Improves life satisfaction",
            "Strengthens relationships",
            "Reduces depression symptoms"
        ],
        "emotional_regulation": [
            "Better emotional awareness",
            "Improved stress management",
            "Healthier relationships", 
            "Increased resilience"
        ],
        "self_compassion": [
            "Reduces self-criticism",
            "Increases self-acceptance",
            "Improves mental health",
            "Builds emotional resilience"
        ],
        "grounding_techniques": [
            "Manages anxiety and panic",
            "Improves present-moment awareness",
            "Provides emotional stability",
            "Helpful for trauma recovery"
        ],
        "positive_visualization": [
            "Reduces anxiety about future events",
            "Improves confidence and motivation",
            "Enhances goal achievement",
            "Promotes relaxation and calm"
        ]
    }
    return benefits.get(skill_name, ["Promotes emotional wellness", "Supports mental health"])

def _generate_skill_recommendations(recent_emotions: List[str], unlocked_skills: set) -> List[Dict[str, Any]]:
    """Generate personalized skill recommendations."""
    recommendations = []
    
    # Count emotion types
    emotion_counts = {}
    for emotion in recent_emotions:
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    # Recommendation logic
    if "anxiety" in recent_emotions or "worry" in recent_emotions:
        if "grounding_techniques" in unlocked_skills:
            recommendations.append({
                "skill_name": "grounding_techniques",
                "reason": "Your recent anxiety patterns suggest grounding techniques could be very helpful",
                "priority": "high",
                "immediate_benefit": "Helps calm anxious thoughts and brings you back to the present moment"
            })
        
        if "mindful_breathing" in unlocked_skills:
            recommendations.append({
                "skill_name": "mindful_breathing",
                "reason": "Breathing exercises are excellent for managing anxiety",
                "priority": "high", 
                "immediate_benefit": "Activates your body's relaxation response"
            })
    
    if "sadness" in recent_emotions or "disappointment" in recent_emotions:
        if "self_compassion" in unlocked_skills:
            recommendations.append({
                "skill_name": "self_compassion",
                "reason": "Self-compassion can help you navigate difficult emotions with kindness",
                "priority": "medium",
                "immediate_benefit": "Reduces self-criticism and provides emotional comfort"
            })
        
        if "gratitude_practice" in unlocked_skills:
            recommendations.append({
                "skill_name": "gratitude_practice",
                "reason": "Gratitude practice can help shift focus to positive aspects of your life",
                "priority": "medium",
                "immediate_benefit": "Naturally boosts mood and perspective"
            })
    
    if "anger" in recent_emotions or "frustration" in recent_emotions:
        if "emotional_regulation" in unlocked_skills:
            recommendations.append({
                "skill_name": "emotional_regulation",
                "reason": "Learning emotional regulation can help you respond rather than react",
                "priority": "high",
                "immediate_benefit": "Creates space between triggers and responses"
            })
        
        if "mindful_breathing" in unlocked_skills:
            recommendations.append({
                "skill_name": "mindful_breathing", 
                "reason": "Deep breathing can help cool down intense emotions",
                "priority": "medium",
                "immediate_benefit": "Physically calms your nervous system"
            })
    
    if "joy" in recent_emotions or "gratitude" in recent_emotions:
        if "positive_visualization" in unlocked_skills:
            recommendations.append({
                "skill_name": "positive_visualization",
                "reason": "Your positive energy makes this a great time for visualization practice",
                "priority": "low",
                "immediate_benefit": "Amplifies positive emotions and builds confidence"
            })
    
    # General recommendations for regular practice
    if "mindful_breathing" in unlocked_skills and len(recommendations) == 0:
        recommendations.append({
            "skill_name": "mindful_breathing",
            "reason": "Daily breathing practice forms a solid foundation for emotional wellness",
            "priority": "medium",
            "immediate_benefit": "Establishes a regular mindfulness practice"
        })
    
    # Sort by priority and return top 3
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 2))
    
    return recommendations[:3]

@router.get("/available/list")
async def get_available_skills():
    """Get list of all available skills with descriptions."""
    try:
        from app.utils.helpers import get_skill_description
        from app.config import settings
        
        skills_info = []
        for skill_name in settings.SKILLS_LIST:
            skill_info = get_skill_description(skill_name, 0)
            skills_info.append({
                "skill_name": skill_name,
                "display_name": skill_info["name"],
                "description": skill_info["description"],
                "category": _get_skill_category(skill_name),
                "difficulty": _get_skill_difficulty(skill_name),
                "benefits": _get_skill_benefits(skill_name)
            })
        
        return {"skills": skills_info}
        
    except Exception as e:
        logger.error(f"Error getting available skills: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available skills")

# ADD THIS ENDPOINT - Frontend calls this to get personalized skill recommendations
@router.get("/recommendations/{session_id}")
async def get_skill_recommendations(session_id: str, db: Session = Depends(get_db)):
    """Get personalized skill recommendations based on user's emotional patterns."""
    try:
        from app.models.sanctuary import JournalEntry, UserSkill
        from sqlalchemy import desc
        
        # Get recent emotional patterns
        recent_entries = db.query(JournalEntry).filter(
            JournalEntry.session_id == session_id
        ).order_by(desc(JournalEntry.created_at)).limit(10).all()
        
        # Get user's current skills
        user_skills = db.query(UserSkill).filter(
            UserSkill.session_id == session_id,
            UserSkill.unlocked == True
        ).all()
        
        unlocked_skills = {skill.skill_name for skill in user_skills}
        recent_emotions = [entry.emotion for entry in recent_entries]
        
        recommendations = _generate_skill_recommendations(recent_emotions, unlocked_skills)
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        logger.error(f"Error getting skill recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get skill recommendations")