import uuid
import random
import math
from typing import Tuple, Dict, List, Any
from datetime import datetime, timedelta

def generate_session_id() -> str:
    """Generate a unique session ID."""
    return str(uuid.uuid4())

def sentiment_to_emotion(sentiment_score: float) -> str:
    """Convert sentiment score to emotion category."""
    if sentiment_score > 0.6:
        return random.choice(["joy", "excitement", "gratitude", "love", "hope"])
    elif sentiment_score > 0.2:
        return random.choice(["contentment", "calm", "peace", "optimism"])
    elif sentiment_score > -0.2:
        return random.choice(["neutral", "contemplation", "acceptance"])
    elif sentiment_score > -0.6:
        return random.choice(["sadness", "worry", "disappointment", "longing"])
    else:
        return random.choice(["anger", "frustration", "despair", "anxiety"])

def emotion_to_color(emotion: str) -> str:
    """Map emotion to color."""
    emotion_colors = {
        # Positive emotions
        "joy": "#FFD700",
        "excitement": "#FF6B35", 
        "gratitude": "#98D8C8",
        "love": "#FF69B4",
        "hope": "#87CEEB",
        "contentment": "#DDA0DD",
        "calm": "#B0E0E6",
        "peace": "#F0F8FF",
        "optimism": "#FFA07A",
        
        # Neutral emotions
        "neutral": "#D3D3D3",
        "contemplation": "#9370DB",
        "acceptance": "#F5DEB3",
        
        # Negative emotions
        "sadness": "#4169E1",
        "worry": "#8B7D6B",
        "disappointment": "#708090",
        "longing": "#DDA0DD",
        "anger": "#DC143C",
        "frustration": "#CD5C5C", 
        "despair": "#2F4F4F",
        "anxiety": "#696969"
    }
    return emotion_colors.get(emotion.lower(), "#D3D3D3")

def emotion_to_element_type(emotion: str, sentiment_score: float) -> str:
    """Map emotion and sentiment to sanctuary element type."""
    if sentiment_score > 0.4:
        return random.choice(["flower", "tree", "butterfly", "bird"])
    elif sentiment_score > 0:
        return random.choice(["plant", "stone", "water", "cloud"])
    elif sentiment_score > -0.4:
        return random.choice(["rock", "moss", "mist", "stream"])
    else:
        return random.choice(["crystal", "cave", "shadow", "wind"])

def calculate_element_position(existing_elements: List[Dict], canvas_width: int = 800, canvas_height: int = 600) -> Tuple[float, float]:
    """Calculate position for new sanctuary element avoiding overlaps."""
    max_attempts = 50
    min_distance = 80
    
    for _ in range(max_attempts):
        x = random.uniform(50, canvas_width - 50)
        y = random.uniform(50, canvas_height - 50)
        
        # Check distance from existing elements
        too_close = False
        for element in existing_elements:
            distance = math.sqrt((x - element['x_position'])**2 + (y - element['y_position'])**2)
            if distance < min_distance:
                too_close = True
                break
        
        if not too_close:
            return x, y
    
    # Fallback to random position if no good spot found
    return random.uniform(50, canvas_width - 50), random.uniform(50, canvas_height - 50)

def calculate_element_size(sentiment_score: float) -> float:
    """Calculate element size based on sentiment intensity."""
    base_size = 1.0
    intensity = abs(sentiment_score)
    return base_size + (intensity * 0.5)  # Size ranges from 1.0 to 1.5

def extract_themes_from_text(text: str) -> List[str]:
    """Extract therapeutic themes from journal text."""
    themes = []
    text_lower = text.lower()
    
    theme_keywords = {
        "growth": ["grow", "development", "progress", "improve", "better", "learning"],
        "resilience": ["overcome", "strong", "survive", "endure", "bounce back", "recover"],
        "gratitude": ["thankful", "grateful", "appreciate", "blessed", "lucky"],
        "self_care": ["care", "rest", "relax", "treat myself", "self-love", "nurture"],
        "relationships": ["friend", "family", "love", "connection", "together", "support"],
        "mindfulness": ["present", "aware", "mindful", "focus", "breathe", "meditate"],
        "goals": ["achieve", "goal", "dream", "aspire", "ambition", "future"],
        "healing": ["heal", "recover", "mend", "restore", "peace", "wholeness"]
    }
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            themes.append(theme)
    
    return themes if themes else ["reflection"]

def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """Calculate estimated reading time in minutes."""
    word_count = len(text.split())
    return max(1, math.ceil(word_count / words_per_minute))

def get_skill_description(skill_name: str, mastery_level: int) -> Dict[str, Any]:
    """Get skill description and guidance based on mastery level."""
    skill_data = {
        "mindful_breathing": {
            "name": "Mindful Breathing",
            "description": "Practice conscious breathing to center yourself and reduce anxiety.",
            "levels": [
                {"level": 0, "title": "Beginner", "description": "Learn basic 4-4-4 breathing pattern"},
                {"level": 1, "title": "Developing", "description": "Extend to 4-7-8 breathing technique"},
                {"level": 2, "title": "Practiced", "description": "Incorporate body awareness during breathing"},
                {"level": 3, "title": "Skilled", "description": "Use breathing for emotional regulation"},
                {"level": 4, "title": "Master", "description": "Teach breathing techniques to others"}
            ]
        },
        "gratitude_practice": {
            "name": "Gratitude Practice", 
            "description": "Cultivate appreciation and positive perspective through gratitude exercises.",
            "levels": [
                {"level": 0, "title": "Beginner", "description": "List 3 things you're grateful for daily"},
                {"level": 1, "title": "Developing", "description": "Write detailed gratitude reflections"},
                {"level": 2, "title": "Practiced", "description": "Express gratitude to others regularly"},
                {"level": 3, "title": "Skilled", "description": "Find gratitude in challenging situations"},
                {"level": 4, "title": "Master", "description": "Live from a place of constant appreciation"}
            ]
        },
        "emotional_regulation": {
            "name": "Emotional Regulation",
            "description": "Develop skills to understand and manage your emotional responses.",
            "levels": [
                {"level": 0, "title": "Beginner", "description": "Identify and name your emotions"},
                {"level": 1, "title": "Developing", "description": "Recognize emotional triggers"},
                {"level": 2, "title": "Practiced", "description": "Use pause technique before reacting"},
                {"level": 3, "title": "Skilled", "description": "Transform negative emotions into wisdom"},
                {"level": 4, "title": "Master", "description": "Help others with emotional balance"}
            ]
        },
        "self_compassion": {
            "name": "Self-Compassion",
            "description": "Practice kindness toward yourself, especially during difficult times.",
            "levels": [
                {"level": 0, "title": "Beginner", "description": "Notice self-critical thoughts"},
                {"level": 1, "title": "Developing", "description": "Replace criticism with kind words"},
                {"level": 2, "title": "Practiced", "description": "Treat yourself as you would a good friend"},
                {"level": 3, "title": "Skilled", "description": "Embrace imperfection with loving acceptance"},
                {"level": 4, "title": "Master", "description": "Model self-compassion for others"}
            ]
        },
        "grounding_techniques": {
            "name": "Grounding Techniques",
            "description": "Use sensory awareness to stay present and connected to the moment.",
            "levels": [
                {"level": 0, "title": "Beginner", "description": "Practice 5-4-3-2-1 sensory grounding"},
                {"level": 1, "title": "Developing", "description": "Use body-based grounding exercises"},
                {"level": 2, "title": "Practiced", "description": "Ground yourself in nature settings"},
                {"level": 3, "title": "Skilled", "description": "Quick grounding in stressful situations"},
                {"level": 4, "title": "Master", "description": "Maintain groundedness throughout daily life"}
            ]
        },
        "positive_visualization": {
            "name": "Positive Visualization",
            "description": "Use mental imagery to create calm, confidence, and positive outcomes.",
            "levels": [
                {"level": 0, "title": "Beginner", "description": "Visualize peaceful, calming scenes"},
                {"level": 1, "title": "Developing", "description": "Create detailed safe space visualizations"},
                {"level": 2, "title": "Practiced", "description": "Visualize successful outcomes for goals"},
                {"level": 3, "title": "Skilled", "description": "Use visualization for healing and recovery"},
                {"level": 4, "title": "Master", "description": "Guide others through visualization exercises"}
            ]
        }
    }
    
    skill_info = skill_data.get(skill_name, {
        "name": skill_name.replace("_", " ").title(),
        "description": "A therapeutic skill for emotional wellness.",
        "levels": [{"level": i, "title": "Level " + str(i), "description": f"Level {i} practice"} for i in range(5)]
    })
    
    current_level = skill_info["levels"][min(mastery_level, 4)]
    return {
        "name": skill_info["name"],
        "description": skill_info["description"],
        "current_level": current_level,
        "all_levels": skill_info["levels"]
    }

def should_unlock_skill(skill_name: str, emotion_history: List[Dict], journal_entries: List[Dict]) -> bool:
    """Determine if a skill should be unlocked based on user patterns."""
    if not emotion_history:
        return skill_name == "mindful_breathing"  # Always unlock breathing first
    
    recent_emotions = [entry.get("emotion", "") for entry in emotion_history[-10:]]
    recent_sentiments = [entry.get("sentiment_score", 0) for entry in emotion_history[-10:]]
    
    # Skill unlock logic
    unlock_conditions = {
        "mindful_breathing": True,  # Always available
        "gratitude_practice": any(sentiment > 0.3 for sentiment in recent_sentiments[-5:]),
        "emotional_regulation": len([s for s in recent_sentiments if abs(s) > 0.7]) >= 3,
        "self_compassion": "sadness" in recent_emotions or "disappointment" in recent_emotions,
        "grounding_techniques": "anxiety" in recent_emotions or "worry" in recent_emotions,
        "positive_visualization": len(journal_entries) >= 3
    }
    
    return unlock_conditions.get(skill_name, False)