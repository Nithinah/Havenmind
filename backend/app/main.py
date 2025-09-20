from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import uvicorn
import os

from app.config import settings
from app.database import init_db
from app.routers import sanctuary_router, story_router, skills_router

# Configure logging for Render
logging.basicConfig(
    level=logging.INFO,  # Use INFO level for production
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="HavenMind API",
    description="Therapeutic sanctuary application with AI-powered emotional support",
    version="1.0.0",
    docs_url="/docs",  # Always enable docs for Render
    redoc_url="/redoc"
)

# Render-optimized CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"] if settings.DEBUG else settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
    max_age=86400,
)

# Render-compatible trusted host middleware
render_hosts = ["localhost", "127.0.0.1", "0.0.0.0"]
if settings.RENDER_ENVIRONMENT:
    render_hosts.extend([
        "*.onrender.com",
        "*.render.com"
    ])

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=render_hosts if settings.DEBUG or settings.RENDER_ENVIRONMENT else ["yourdomain.com"]
)

# Include routers
app.include_router(sanctuary_router)
app.include_router(story_router)
app.include_router(skills_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup."""
    try:
        logger.info("🚀 Initializing HavenMind API on Render...")
        
        # Log environment info
        logger.info(f"Environment: {'Render Production' if settings.RENDER_ENVIRONMENT else 'Local Development'}")
        logger.info(f"Port: {settings.PORT}")
        logger.info(f"Debug mode: {settings.DEBUG}")
        
        # Initialize database
        try:
            init_db()
            logger.info("✅ Database initialized successfully")
        except Exception as db_error:
            logger.error(f"❌ Database initialization failed: {db_error}")
            if not settings.RENDER_ENVIRONMENT:
                raise  # Fail locally, but continue on Render
        
        # Log database info
        if "postgresql://" in settings.database_url:
            logger.info("📊 Database: PostgreSQL (Render)")
        else:
            logger.info("📊 Database: SQLite (Local)")
        
        # Check API keys
        api_keys_status = {
            "Stability AI": bool(settings.STABILITY_AI_API_KEY),
            "Gemini": bool(settings.GEMINI_API_KEY), 
            "Groq": bool(settings.GROQ_API_KEY)
        }
        
        for service, available in api_keys_status.items():
            status = "✅ Available" if available else "⚠️ Missing"
            logger.info(f"{service} API Key: {status}")
        
        logger.info("🎉 HavenMind API startup complete!")
        
    except Exception as e:
        logger.error(f"💥 Startup failed: {e}")
        if not settings.RENDER_ENVIRONMENT:
            raise

@app.on_event("shutdown") 
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("🛑 HavenMind API shutting down...")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "internal_error"
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.middleware("http")
async def add_cors_headers(request, call_next):
    """Add CORS headers to all responses."""
    response = await call_next(request)
    
    # Add CORS headers to all responses
    origin = request.headers.get("origin")
    if origin and (origin in settings.cors_origins or settings.DEBUG):
        response.headers["Access-Control-Allow-Origin"] = origin
    elif settings.DEBUG or settings.RENDER_ENVIRONMENT:
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    response.headers["Access-Control-Allow-Credentials"] = "false"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    
    return response

# Explicit OPTIONS handler for all routes
@app.options("/{path:path}")
async def handle_options(path: str):
    """Handle preflight OPTIONS requests for all paths."""
    return JSONResponse(
        status_code=200,
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        }
    )

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "HavenMind API",
        "version": "1.0.0",
        "description": "Therapeutic sanctuary application with AI-powered emotional support",
        "status": "healthy",
        "platform": "Render" if settings.RENDER_ENVIRONMENT else "Local",
        "environment": "production" if settings.RENDER_ENVIRONMENT else "development",
        "endpoints": {
            "sanctuary": "/sanctuary",
            "story": "/story", 
            "skills": "/skills",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        db_status = "unknown"
        try:
            from app.database import engine
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            logger.warning(f"Database health check failed: {e}")
            db_status = "disconnected"
        
        # Check API keys
        api_status = {
            "stability_ai": bool(settings.STABILITY_AI_API_KEY),
            "gemini": bool(settings.GEMINI_API_KEY),
            "groq": bool(settings.GROQ_API_KEY)
        }
        
        return {
            "status": "healthy",
            "platform": "Render" if settings.RENDER_ENVIRONMENT else "Local",
            "database": db_status,
            "database_type": "PostgreSQL" if "postgresql://" in settings.database_url else "SQLite",
            "api_services": api_status,
            "port": settings.PORT,
            "cors_origins": len(settings.cors_origins)
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

if __name__ == "__main__":
    logger.info(f"🚀 Starting HavenMind API on {settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG and not settings.RENDER_ENVIRONMENT,  # No reload on Render
        log_level="info"
    )