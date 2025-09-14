from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging
from app.models.sanctuary import UserSkill, SkillSession
from app.utils.helpers import get_skill_description, should_unlock_skill
from app.config import settings

logger = logging.getLogger(__name__)

class SkillsService:
    def __init__(self):
        self.available_skills = settings.SKILLS_LIST
        self.mastery_levels = settings.SKILL_MASTERY_LEVELS
    
    async def get_user_skills(self, db: Session, session_id: str) -> List[Dict[str, Any]]:
        """Get all skills for a user, creating defaults if needed."""
        try:
            # Get existing skills
            existing_skills = db.query(UserSkill).filter(
                UserSkill.session_id == session_id
            ).all()
            
            existing_skill_names = {skill.skill_name for skill in existing_skills}
            
            # Create missing skills
            for skill_name in self.available_skills:
                if skill_name not in existing_skill_names:
                    new_skill = UserSkill(
                        session_id=session_id,
                        skill_name=skill_name,
                        mastery_level=0,
                        experience_points=0,
                        times_practiced=0,
                        unlocked=(skill_name == "mindful_breathing")  # Always unlock breathing first
                    )
                    db.add(new_skill)
            
            db.commit()
            
            # Get all skills again
            all_skills = db.query(UserSkill).filter(
                UserSkill.session_id == session_id
            ).all()
            
            # Convert to response format with descriptions
            skills_data = []
            for skill in all_skills:
                skill_info = get_skill_description(skill.skill_name, skill.mastery_level)
                
                skills_data.append({
                    "skill_name": skill.skill_name,
                    "display_name": skill_info["name"],
                    "description": skill_info["description"],
                    "mastery_level": skill.mastery_level,
                    "experience_points": skill.experience_points,
                    "times_practiced": skill.times_practiced,
                    "unlocked": skill.unlocked,
                    "last_practiced": skill.last_practiced,
                    "current_level_info": skill_info["current_level"],
                    "all_levels": skill_info["all_levels"],
                    "progress_to_next": self._calculate_progress_to_next(skill)
                })
            
            return sorted(skills_data, key=lambda x: (not x["unlocked"], x["skill_name"]))
            
        except Exception as e:
            logger.error(f"Error getting user skills: {e}")
            return []
    
    async def update_skill_unlocks(
        self, 
        db: Session, 
        session_id: str,
        emotion_history: List[Dict],
        journal_entries: List[Dict]
    ) -> List[str]:
        """Update skill unlocks based on user patterns and return newly unlocked skills."""
        try:
            newly_unlocked = []
            
            for skill_name in self.available_skills:
                # Check if skill should be unlocked
                if should_unlock_skill(skill_name, emotion_history, journal_entries):
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
                        newly_unlocked.append(skill_name)
                    elif not skill.unlocked:
                        skill.unlocked = True
                        newly_unlocked.append(skill_name)
            
            db.commit()
            return newly_unlocked
            
        except Exception as e:
            logger.error(f"Error updating skill unlocks: {e}")
            return []
    
    async def practice_skill(
        self,
        db: Session,
        session_id: str,
        skill_name: str,
        duration_minutes: int,
        completion_rating: Optional[int] = None,
        notes: Optional[str] = None,
        emotions_before: Optional[Dict[str, Any]] = None,
        emotions_after: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Record skill practice session and update progress."""
        try:
            # Get or create user skill
            user_skill = db.query(UserSkill).filter(
                UserSkill.session_id == session_id,
                UserSkill.skill_name == skill_name
            ).first()
            
            if not user_skill:
                user_skill = UserSkill(
                    session_id=session_id,
                    skill_name=skill_name,
                    unlocked=True
                )
                db.add(user_skill)
                db.flush()
            
            # Create skill session record
            skill_session = SkillSession(
                session_id=session_id,
                skill_name=skill_name,
                duration_minutes=duration_minutes,
                completion_rating=completion_rating,
                notes=notes,
                emotions_before=emotions_before,
                emotions_after=emotions_after
            )
            db.add(skill_session)
            
            # Update user skill progress
            old_level = user_skill.mastery_level
            experience_gained = self._calculate_experience_gained(
                duration_minutes, completion_rating
            )
            
            user_skill.experience_points += experience_gained
            user_skill.times_practiced += 1
            user_skill.last_practiced = datetime.utcnow()
            
            # Check for level up
            new_level = self._calculate_mastery_level(user_skill.experience_points)
            level_up = new_level > old_level
            user_skill.mastery_level = min(new_level, self.mastery_levels - 1)
            
            db.commit()
            
            # Get updated skill info
            skill_info = get_skill_description(skill_name, user_skill.mastery_level)
            
            return {
                "success": True,
                "experience_gained": experience_gained,
                "total_experience": user_skill.experience_points,
                "old_level": old_level,
                "new_level": user_skill.mastery_level,
                "level_up": level_up,
                "times_practiced": user_skill.times_practiced,
                "skill_info": skill_info,
                "session_id": skill_session.id
            }
            
        except Exception as e:
            logger.error(f"Error recording skill practice: {e}")
            db.rollback()
            return {
                "success": False,
                "error": str(e)
            }
    
    def _calculate_experience_gained(
        self, 
        duration_minutes: int, 
        completion_rating: Optional[int] = None
    ) -> int:
        """Calculate experience points gained from a practice session."""
        base_experience = duration_minutes * 2  # 2 XP per minute
        
        # Bonus for completion rating
        if completion_rating:
            rating_bonus = completion_rating * 5  # 5 XP per star
            base_experience += rating_bonus
        
        # Cap experience per session
        return min(base_experience, 100)
    
    def _calculate_mastery_level(self, experience_points: int) -> int:
        """Calculate mastery level based on experience points."""
        # Experience thresholds for each level
        thresholds = [0, 50, 150, 300, 500, 800]  # Levels 0-5
        
        for level, threshold in enumerate(thresholds):
            if experience_points < threshold:
                return max(0, level - 1)
        
        return len(thresholds) - 1  # Max level
    
    def _calculate_progress_to_next(self, skill: UserSkill) -> float:
        """Calculate progress percentage to next mastery level."""
        if skill.mastery_level >= self.mastery_levels - 1:
            return 1.0  # Already at max level
        
        thresholds = [0, 50, 150, 300, 500, 800]
        
        current_threshold = thresholds[skill.mastery_level]
        next_threshold = thresholds[skill.mastery_level + 1]
        
        progress_in_level = skill.experience_points - current_threshold
        level_range = next_threshold - current_threshold
        
        return min(1.0, progress_in_level / level_range)
    
    async def get_skill_guidance(
        self,
        skill_name: str,
        mastery_level: int,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get detailed guidance for practicing a specific skill."""
        
        guidance_data = {
            "mindful_breathing": {
                0: {
                    "title": "Basic Mindful Breathing",
                    "description": "Learn the foundation of conscious breathing",
                    "steps": [
                        "Find a comfortable seated position",
                        "Place one hand on your chest, one on your belly",
                        "Breathe in slowly through your nose for 4 counts",
                        "Hold your breath for 4 counts", 
                        "Exhale slowly through your mouth for 4 counts",
                        "Repeat for 5-10 cycles"
                    ],
                    "duration": "5-10 minutes",
                    "tips": ["Focus on the feeling of air moving in and out", "Don't worry if your mind wanders, just return to your breath"]
                },
                1: {
                    "title": "Extended Breathing Practice",
                    "description": "Develop the 4-7-8 breathing technique",
                    "steps": [
                        "Sit or lie down comfortably",
                        "Exhale completely through your mouth",
                        "Close your mouth and inhale through nose for 4 counts",
                        "Hold your breath for 7 counts",
                        "Exhale through mouth for 8 counts",
                        "Repeat 4-8 cycles"
                    ],
                    "duration": "10-15 minutes",
                    "tips": ["This pattern is especially calming", "Practice regularly for best results"]
                }
            },
            
            "gratitude_practice": {
                0: {
                    "title": "Daily Gratitude List",
                    "description": "Build the habit of recognizing daily blessings",
                    "steps": [
                        "Set aside 5 minutes each day",
                        "Write down 3 things you're grateful for",
                        "Be specific about why you're grateful",
                        "Include small and large things",
                        "Read your list aloud to yourself"
                    ],
                    "duration": "5-10 minutes",
                    "tips": ["Try to find new things each day", "Include people, experiences, and simple pleasures"]
                },
                1: {
                    "title": "Deeper Gratitude Reflection",
                    "description": "Explore the deeper meaning behind your gratitude",
                    "steps": [
                        "Choose one thing you're grateful for",
                        "Write a paragraph about why it matters to you",
                        "Reflect on how it has impacted your life",
                        "Consider how you can honor this blessing",
                        "Share your gratitude with someone if appropriate"
                    ],
                    "duration": "10-15 minutes",
                    "tips": ["Focus on quality over quantity", "Let yourself really feel the gratitude"]
                }
            },
            
            "emotional_regulation": {
                0: {
                    "title": "Emotion Identification",
                    "description": "Learn to recognize and name your emotions",
                    "steps": [
                        "Pause and check in with yourself",
                        "Notice what you're feeling in your body",
                        "Name the emotion as specifically as possible",
                        "Rate the intensity from 1-10",
                        "Ask yourself: What triggered this feeling?",
                        "Accept the emotion without judgment"
                    ],
                    "duration": "3-5 minutes",
                    "tips": ["Use an emotion wheel for more specific words", "Remember all emotions are valid"]
                },
                1: {
                    "title": "The Emotional Pause",
                    "description": "Create space between trigger and response",
                    "steps": [
                        "When you notice a strong emotion, stop",
                        "Take 3 deep breaths",
                        "Name what you're feeling",
                        "Ask: What does this emotion need?",
                        "Choose your response consciously",
                        "Act from wisdom, not just feeling"
                    ],
                    "duration": "2-3 minutes",
                    "tips": ["The pause gets easier with practice", "Even a few seconds can make a difference"]
                }
            },
            
            "self_compassion": {
                0: {
                    "title": "Self-Compassion Break",
                    "description": "Practice the three components of self-compassion",
                    "steps": [
                        "Acknowledge: 'This is a moment of difficulty'",
                        "Remember: 'Difficulty is part of life'",
                        "Offer yourself kindness: 'May I be kind to myself'",
                        "Place a gentle hand on your heart",
                        "Take a few deep breaths",
                        "Speak to yourself as you would a dear friend"
                    ],
                    "duration": "3-5 minutes",
                    "tips": ["Use your own words that feel authentic", "Physical touch can enhance the practice"]
                },
                1: {
                    "title": "Self-Compassionate Letter",
                    "description": "Write yourself a letter of understanding and support",
                    "steps": [
                        "Think of a situation causing you difficulty",
                        "Write a letter to yourself from the perspective of a loving friend",
                        "Acknowledge your pain without minimizing it",
                        "Remind yourself that struggle is human",
                        "Offer yourself words of encouragement",
                        "Include what you need to hear right now"
                    ],
                    "duration": "15-20 minutes",
                    "tips": ["Write as if to your best friend", "Keep the letter to read when needed"]
                }
            },
            
            "grounding_techniques": {
                0: {
                    "title": "5-4-3-2-1 Grounding",
                    "description": "Use your senses to connect with the present moment",
                    "steps": [
                        "Name 5 things you can see",
                        "Name 4 things you can touch",
                        "Name 3 things you can hear",
                        "Name 2 things you can smell",
                        "Name 1 thing you can taste",
                        "Take a few deep breaths"
                    ],
                    "duration": "3-5 minutes",
                    "tips": ["Take your time with each sense", "Really focus on the details"]
                },
                1: {
                    "title": "Body-Based Grounding",
                    "description": "Use physical sensations to anchor yourself",
                    "steps": [
                        "Feel your feet on the ground",
                        "Press your palms together",
                        "Squeeze and release your fists",
                        "Roll your shoulders back",
                        "Feel your back against your chair",
                        "Notice your breath naturally flowing"
                    ],
                    "duration": "3-7 minutes",
                    "tips": ["Focus on physical sensations", "Move slowly and mindfully"]
                }
            },
            
            "positive_visualization": {
                0: {
                    "title": "Safe Place Visualization",
                    "description": "Create a mental sanctuary for peace and calm",
                    "steps": [
                        "Close your eyes and breathe deeply",
                        "Imagine a place where you feel completely safe",
                        "See the details: colors, textures, lighting",
                        "Notice sounds and smells in this place",
                        "Feel the sense of peace and safety",
                        "Know you can return here anytime"
                    ],
                    "duration": "10-15 minutes",
                    "tips": ["Your safe place can be real or imaginary", "Make it as vivid as possible"]
                },
                1: {
                    "title": "Success Visualization",
                    "description": "Visualize positive outcomes and achievements",
                    "steps": [
                        "Choose a goal or challenge you're facing",
                        "Imagine yourself handling it successfully",
                        "See yourself confident and capable",
                        "Notice how success feels in your body",
                        "Visualize the positive impact on your life",
                        "End with affirmations of your capability"
                    ],
                    "duration": "10-20 minutes",
                    "tips": ["Make the visualization detailed and realistic", "Include emotional and physical sensations"]
                }
            }
        }
        
        skill_guidance = guidance_data.get(skill_name, {})
        level_guidance = skill_guidance.get(mastery_level)
        
        if not level_guidance:
            # Fallback guidance
            level_guidance = {
                "title": f"Level {mastery_level} Practice",
                "description": f"Continue developing your {skill_name.replace('_', ' ')} skills",
                "steps": [
                    "Set aside dedicated practice time",
                    "Focus on consistency over perfection",
                    "Notice how the practice affects you",
                    "Be patient with your progress"
                ],
                "duration": "10-15 minutes",
                "tips": ["Regular practice is key to mastery", "Celebrate small improvements"]
            }
        
        # Add contextual modifications based on user context
        if user_context:
            level_guidance = self._customize_guidance(level_guidance, user_context)
        
        return level_guidance
    
    def _customize_guidance(
        self, 
        guidance: Dict[str, Any], 
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Customize guidance based on user's current emotional state and context."""
        
        current_emotion = user_context.get("current_emotion", "neutral")
        stress_level = user_context.get("stress_level", "medium")
        time_available = user_context.get("time_available", "normal")
        
        # Adjust duration based on available time
        if time_available == "short":
            guidance["duration"] = guidance["duration"].replace("10-15", "5-8").replace("15-20", "8-12")
            guidance["tips"].append("Even a short practice can be beneficial")
        elif time_available == "long":
            guidance["duration"] = guidance["duration"].replace("5-10", "10-15").replace("10-15", "15-25")
            guidance["tips"].append("Take advantage of this longer time to deepen your practice")
        
        # Add emotion-specific tips
        emotion_tips = {
            "anxiety": "Go slowly and be gentle with yourself",
            "sadness": "It's okay if emotions come up during practice",
            "anger": "Use this practice to create space and calm",
            "joy": "Let this positive energy enhance your practice",
            "stress": "Focus on releasing tension with each breath"
        }
        
        if current_emotion in emotion_tips:
            guidance["tips"].append(emotion_tips[current_emotion])
        
        return guidance
    
    async def get_skill_statistics(
        self, 
        db: Session, 
        session_id: str
    ) -> Dict[str, Any]:
        """Get comprehensive skill practice statistics."""
        try:
            # Get total practice time
            total_time = db.query(func.sum(SkillSession.duration_minutes)).filter(
                SkillSession.session_id == session_id
            ).scalar() or 0
            
            # Get practice sessions count
            total_sessions = db.query(func.count(SkillSession.id)).filter(
                SkillSession.session_id == session_id
            ).scalar() or 0
            
            # Get unlocked skills count
            unlocked_count = db.query(func.count(UserSkill.id)).filter(
                UserSkill.session_id == session_id,
                UserSkill.unlocked == True
            ).scalar() or 0
            
            # Get average completion rating
            avg_rating = db.query(func.avg(SkillSession.completion_rating)).filter(
                SkillSession.session_id == session_id,
                SkillSession.completion_rating.isnot(None)
            ).scalar() or 0
            
            # Get most practiced skill
            most_practiced = db.query(
                SkillSession.skill_name,
                func.count(SkillSession.id).label('count')
            ).filter(
                SkillSession.session_id == session_id
            ).group_by(SkillSession.skill_name).order_by(
                func.count(SkillSession.id).desc()
            ).first()
            
            # Get recent practice streak
            streak = await self._calculate_practice_streak(db, session_id)
            
            return {
                "total_practice_time_minutes": total_time,
                "total_sessions": total_sessions,
                "unlocked_skills_count": unlocked_count,
                "total_skills_count": len(self.available_skills),
                "average_completion_rating": round(avg_rating, 1) if avg_rating else 0,
                "most_practiced_skill": most_practiced.skill_name if most_practiced else None,
                "current_streak_days": streak,
                "skills_mastery_distribution": await self._get_mastery_distribution(db, session_id)
            }
            
        except Exception as e:
            logger.error(f"Error getting skill statistics: {e}")
            return {}
    
    async def _calculate_practice_streak(self, db: Session, session_id: str) -> int:
        """Calculate current practice streak in days."""
        try:
            # Get distinct practice dates in descending order
            practice_dates = db.query(
                func.date(SkillSession.created_at).label('practice_date')
            ).filter(
                SkillSession.session_id == session_id
            ).distinct().order_by(
                func.date(SkillSession.created_at).desc()
            ).all()
            
            if not practice_dates:
                return 0
            
            # Check for consecutive days
            streak = 0
            current_date = datetime.utcnow().date()
            
            for practice_date_row in practice_dates:
                practice_date = practice_date_row.practice_date
                
                if practice_date == current_date or practice_date == current_date - timedelta(days=streak):
                    streak += 1
                    current_date = practice_date
                else:
                    break
            
            return streak
            
        except Exception as e:
            logger.error(f"Error calculating practice streak: {e}")
            return 0
    
    async def _get_mastery_distribution(self, db: Session, session_id: str) -> Dict[int, int]:
        """Get distribution of skills across mastery levels."""
        try:
            distribution = {}
            
            results = db.query(
                UserSkill.mastery_level,
                func.count(UserSkill.id).label('count')
            ).filter(
                UserSkill.session_id == session_id
            ).group_by(UserSkill.mastery_level).all()
            
            for level, count in results:
                distribution[level] = count
            
            return distribution
            
        except Exception as e:
            logger.error(f"Error getting mastery distribution: {e}")
            return {}

# Global service instance
skills_service = SkillsService()