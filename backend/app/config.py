import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Keys
    STABILITY_AI_API_KEY: str = os.getenv("STABILITY_AI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./havenmind.db")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3050",
        "http://localhost:3051",
        "http://127.0.0.1:3050",
        "http://127.0.0.1:3051",
    ]
    
    # Image Generation
    DEFAULT_IMAGE_SIZE: str = "512x512"
    MAX_IMAGE_GENERATION_RETRIES: int = 3
    
    # Story Generation
    MAX_STORY_LENGTH: int = 1000
    STORY_STYLES: list = [
        "allegory",
        "fairy_tale", 
        "meditation",
        "adventure",
        "wisdom"
    ]
    
    # Skills
    SKILL_MASTERY_LEVELS: int = 5
    SKILLS_LIST: list = [
        "mindful_breathing",
        "gratitude_practice",
        "emotional_regulation",
        "self_compassion",
        "grounding_techniques",
        "positive_visualization"
    ]

settings = Settings()