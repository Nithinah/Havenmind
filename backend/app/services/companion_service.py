import google.generativeai as genai
from groq import Groq
import httpx
import asyncio
import logging
from typing import Dict, Any, Optional, List
from app.config import settings
import random

logger = logging.getLogger(__name__)

class CompanionService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.groq_api_key = settings.GROQ_API_KEY
        
        # Initialize Gemini if key is available
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
        else:
            self.gemini_model = None
            
        # Initialize Groq client
        if self.groq_api_key:
            self.groq_client = Groq(api_key=self.groq_api_key)
        else:
            self.groq_client = None
    
    async def generate_companion_response(
        self,
        journal_entry: str,
        emotion: str,
        sentiment_score: float,
        themes: List[str],
        sanctuary_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate empathetic companion response to journal entry."""
        try:
            # Create context-aware prompt
            prompt = self._create_companion_prompt(
                journal_entry, emotion, sentiment_score, themes, sanctuary_context
            )
            
            # Try Gemini first
            if self.gemini_model:
                response = await self._generate_with_gemini(prompt)
                if response:
                    return response
            
            # Try Groq as fallback
            if self.groq_client:
                response = await self._generate_with_groq(prompt)
                if response:
                    return response
            
            # Ultimate fallback
            return self._generate_empathetic_fallback(emotion, themes)
            
        except Exception as e:
            logger.error(f"Error generating companion response: {e}")
            return self._generate_empathetic_fallback(emotion, themes)
    
    def _create_companion_prompt(
        self,
        journal_entry: str,
        emotion: str,
        sentiment_score: float,
        themes: List[str],
        sanctuary_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a thoughtful prompt for companion response."""
        
        context_info = ""
        if sanctuary_context:
            element_count = sanctuary_context.get("element_count", 0)
            recent_emotions = sanctuary_context.get("recent_emotions", [])
            context_info = f"\nUser has created {element_count} sanctuary elements. Recent emotions: {', '.join(recent_emotions[:3])}."
        
        prompt = f"""You are Luna, a wise and empathetic AI companion in a therapeutic app called HavenMind. Your role is to provide supportive, nurturing responses to users' journal entries.

User's journal entry: "{journal_entry}"

Emotional context:
- Primary emotion: {emotion}
- Sentiment score: {sentiment_score} (range: -1 to 1)
- Identified themes: {', '.join(themes)}
{context_info}

Guidelines for your response:
1. Be warm, empathetic, and non-judgmental
2. Acknowledge their feelings without minimizing them
3. Offer gentle insights or perspectives when appropriate
4. Keep responses between 2-4 sentences
5. Use supportive language that validates their experience
6. If appropriate, gently suggest therapeutic themes or growth opportunities
7. Avoid giving direct advice - instead, ask questions that promote self-reflection
8. Reference their sanctuary journey when relevant

Please respond as Luna would - with wisdom, compassion, and genuine care."""

        return prompt
    
    async def _generate_with_gemini(self, prompt: str) -> Optional[str]:
        """Generate response using Gemini."""
        try:
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=200,
                    temperature=0.7,
                    top_p=0.8,
                )
            )
            
            if response and response.text:
                return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error with Gemini generation: {e}")
            
        return None
    
    async def _generate_with_groq(self, prompt: str) -> Optional[str]:
        """Generate response using Groq."""
        try:
            completion = await asyncio.to_thread(
                self.groq_client.chat.completions.create,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are Luna, a wise and empathetic AI companion providing therapeutic support."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="mixtral-8x7b-32768",
                max_tokens=200,
                temperature=0.7,
                top_p=0.8
            )
            
            if completion.choices and completion.choices[0].message:
                return completion.choices[0].message.content.strip()
                
        except Exception as e:
            logger.error(f"Error with Groq generation: {e}")
            
        return None
    
    def _generate_empathetic_fallback(self, emotion: str, themes: List[str]) -> str:
        """Generate fallback empathetic response."""
        
        # Emotion-based response templates
        emotion_responses = {
            "joy": [
                "I can feel the happiness radiating from your words! It's wonderful to witness these moments of joy in your sanctuary.",
                "Your joy is like sunshine breaking through clouds. These bright moments are precious gifts to cherish.",
                "There's such beautiful energy in what you've shared. Joy has a way of creating ripples of positivity."
            ],
            "love": [
                "The love you're experiencing shines through so clearly. Love has this amazing way of transforming everything it touches.",
                "Your heart seems so open and full right now. Love is one of the most powerful healing forces we have.",
                "I can sense the warmth and connection in your words. Love creates such beautiful sanctuary spaces."
            ],
            "gratitude": [
                "Your gratitude is like a gentle light that illuminates all the goodness around you. Thank you for sharing this.",
                "There's something so grounding about gratitude - it connects us to what truly matters in this moment.",
                "I love how gratitude has a way of shifting our entire perspective. Your awareness of these blessings is beautiful."
            ],
            "calm": [
                "I can feel the peacefulness in your reflection. These moments of calm are like gentle anchors for your soul.",
                "Your sense of tranquility comes through so clearly. Calm is a gift you give yourself and your sanctuary.",
                "There's something so restorative about the peace you're describing. Let this feeling nourish you deeply."
            ],
            "sadness": [
                "I hear the tenderness in your sadness, and I want you to know that these feelings are completely valid and important.",
                "Sadness often carries wisdom within it. Your sanctuary is a safe place to feel and process these emotions.",
                "Thank you for trusting me with these deeper feelings. Even in sadness, you're growing and healing."
            ],
            "anxiety": [
                "I can sense the weight you're carrying right now. Anxiety can feel overwhelming, but you're not facing it alone.",
                "Your awareness of these anxious feelings is actually a sign of strength. Your sanctuary can be an anchor in the storm.",
                "These worried thoughts are trying to protect you, even if they feel uncomfortable. You're safe here to explore them."
            ],
            "anger": [
                "I can feel the intensity of what you're experiencing. Anger often signals that something important to you needs attention.",
                "Your anger is valid and understandable. This emotion carries important information about your boundaries and values.",
                "Thank you for expressing these powerful feelings. Your sanctuary can help transform this energy in healing ways."
            ],
            "neutral": [
                "Sometimes the most profound moments happen in the quiet spaces between emotions. I'm here with you in this reflection.",
                "There's wisdom in these contemplative moments. Your sanctuary grows even in the gentle, quiet times.",
                "I appreciate you sharing these thoughts with me. Every entry adds depth and meaning to your healing journey."
            ]
        }
        
        # Theme-based additions
        theme_additions = {
            "growth": "I can see how much you're growing through this experience.",
            "resilience": "Your strength and resilience shine through your words.",
            "healing": "This reflection is part of your beautiful healing journey.", 
            "relationships": "The connections you're nurturing seem so meaningful.",
            "self_care": "It's wonderful to see you prioritizing your well-being.",
            "mindfulness": "Your presence and awareness in this moment is inspiring.",
            "goals": "Your vision for the future adds such purpose to your journey.",
            "creativity": "There's such creative energy flowing through your thoughts."
        }
        
        # Select base response
        base_responses = emotion_responses.get(emotion, emotion_responses["neutral"])
        response = random.choice(base_responses)
        
        # Add theme-based addition if relevant
        if themes:
            relevant_theme = next((theme for theme in themes if theme in theme_additions), None)
            if relevant_theme:
                response += f" {theme_additions[relevant_theme]}"
        
        return response
    
    async def generate_welcome_message(self, is_returning_user: bool = False) -> str:
        """Generate a welcome message for users."""
        if is_returning_user:
            messages = [
                "Welcome back to your sanctuary! I'm so glad to see you again. What's stirring in your heart today?",
                "Hello again, dear friend! Your sanctuary has been quietly waiting for your return. How are you feeling?",
                "It's wonderful to have you back! I can sense you have something to share. I'm here to listen.",
                "Welcome back to this safe space. Your sanctuary grows more beautiful with each visit. What would you like to explore today?"
            ]
        else:
            messages = [
                "Welcome to HavenMind! I'm Luna, your companion on this journey of healing and growth. What brings you here today?",
                "Hello and welcome! I'm so honored to meet you. This is your sacred space for reflection and healing. What's on your mind?",
                "Welcome to your personal sanctuary! I'm Luna, here to listen, support, and walk alongside you. What would you like to share?",
                "Hello, beautiful soul! Welcome to HavenMind. This is a safe space where your feelings are honored and your growth is celebrated."
            ]
        
        return random.choice(messages)
    
    async def generate_encouragement(self, session_stats: Dict[str, Any]) -> str:
        """Generate encouraging message based on user's progress."""
        total_entries = session_stats.get("total_entries", 0)
        days_active = session_stats.get("days_active", 1)
        dominant_emotion = session_stats.get("dominant_emotion", "neutral")
        
        if total_entries == 1:
            return "What a beautiful beginning! Your first sanctuary element is like planting the seed of healing. I'm excited to see how your sanctuary grows."
        elif total_entries < 5:
            return f"You've created {total_entries} sanctuary elements so far. Each one represents a moment of courage and self-reflection. You're building something truly special."
        elif total_entries < 10:
            return f"Look at your sanctuary flourishing! With {total_entries} elements, you're creating a rich landscape of emotional awareness and growth."
        elif days_active >= 7:
            return f"You've been nurturing your sanctuary for {days_active} days now. This consistency shows such dedication to your healing journey. I'm truly inspired by your commitment."
        else:
            return f"Your sanctuary is becoming a magnificent reflection of your inner world. With {total_entries} elements across {days_active} days, you're creating something truly meaningful."

# Global service instance
companion_service = CompanionService()