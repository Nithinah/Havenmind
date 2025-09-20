import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Keys
    STABILITY_AI_API_KEY: str = os.getenv("STABILITY_AI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Database - Render will provide DATABASE_URL for PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./havenmind.db")
    
    # Fix PostgreSQL URL format for SQLAlchemy 2.0+
    @property
    def database_url(self):
        url = self.DATABASE_URL
        if url and url.startswith('postgres://'):
            return url.replace('postgres://', 'postgresql://', 1)
        return url
    
    # Server - Render sets PORT automatically
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"  # Default to False for production
    
    # CORS - Updated for Render deployment
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        # Render frontend URL will be added via environment variable
    ]
    
    # Add Render frontend URL if provided
    @property
    def cors_origins(self):
        origins = self.CORS_ORIGINS.copy()
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url and frontend_url not in origins:
            origins.append(frontend_url)
        return origins
    
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
    
    # Render-specific settings
    RENDER_ENVIRONMENT: bool = bool(os.getenv("RENDER"))
    
    def log_config(self):
        """Log configuration for debugging"""
        if self.DEBUG or self.RENDER_ENVIRONMENT:
            print(f"🔧 HavenMind Configuration:")
            print(f"   Environment: {'Render' if self.RENDER_ENVIRONMENT else 'Local'}")
            print(f"   Port: {self.PORT}")
            print(f"   Debug: {self.DEBUG}")
            print(f"   Database: {'PostgreSQL' if 'postgresql://' in self.database_url else 'SQLite'}")
            print(f"   CORS Origins: {len(self.cors_origins)} configured")
            print(f"   API Keys: {sum([bool(self.STABILITY_AI_API_KEY), bool(self.GEMINI_API_KEY), bool(self.GROQ_API_KEY)])}/3 configured")

settings = Settings()
settings.log_config()  # Log config on startup