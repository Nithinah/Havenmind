import google.generativeai as genai
from groq import Groq
import asyncio
import logging
from typing import Dict, Any, Optional, List
from app.config import settings
import random
import re

logger = logging.getLogger(__name__)

class StoryService:
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
    
    async def generate_therapeutic_story(
        self,
        session_context: Dict[str, Any],
        story_style: str = "allegory",
        requested_theme: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a therapeutic story based on user's sanctuary context."""
        try:
            # Analyze sanctuary context to determine themes
            theme = requested_theme or self._determine_story_theme(session_context)
            
            # Create story prompt
            prompt = self._create_story_prompt(session_context, story_style, theme)
            
            # Generate story content
            story_content = await self._generate_story_content(prompt)
            
            if not story_content:
                story_content = self._generate_fallback_story(story_style, theme, session_context)
            
            # Post-process story
            story_data = self._process_story_content(story_content, story_style, theme)
            
            return story_data
            
        except Exception as e:
            logger.error(f"Error generating therapeutic story: {e}")
            return self._generate_fallback_story(story_style, requested_theme or "healing", session_context)
    
    def _determine_story_theme(self, session_context: Dict[str, Any]) -> str:
        """Determine appropriate story theme based on sanctuary context."""
        
        emotions = session_context.get("recent_emotions", [])
        themes = session_context.get("identified_themes", [])
        sentiment_trend = session_context.get("sentiment_trend", "neutral")
        
        # Theme selection logic based on emotional patterns
        if "resilience" in themes or any(emotion in ["anger", "frustration", "sadness"] for emotion in emotions):
            return "overcoming_challenges"
        elif "growth" in themes or "goals" in themes:
            return "transformation_and_growth"
        elif "gratitude" in themes or any(emotion in ["joy", "love", "contentment"] for emotion in emotions):
            return "finding_inner_light"
        elif "relationships" in themes:
            return "connection_and_belonging"
        elif "anxiety" in emotions or "worry" in emotions:
            return "finding_peace_in_uncertainty"
        elif "healing" in themes or "self_care" in themes:
            return "the_healing_journey"
        elif "mindfulness" in themes:
            return "present_moment_awareness"
        else:
            return "discovering_inner_wisdom"
    
    def _create_story_prompt(
        self,
        session_context: Dict[str, Any],
        story_style: str,
        theme: str
    ) -> str:
        """Create a detailed prompt for story generation."""
        
        # Extract sanctuary details
        sanctuary_elements = session_context.get("sanctuary_elements", [])
        recent_emotions = session_context.get("recent_emotions", [])
        user_themes = session_context.get("identified_themes", [])
        
        # Create sanctuary description
        sanctuary_desc = self._create_sanctuary_description(sanctuary_elements)
        
        # Style-specific instructions
        style_instructions = {
            "allegory": """Create an allegorical story with symbolic characters and situations that mirror the user's emotional journey. Use metaphors and symbols throughout. The story should have a clear moral or insight that relates to therapeutic growth.""",
            
            "fairy_tale": """Write in the style of a healing fairy tale with magical elements, gentle wisdom, and a hopeful ending. Include elements like wise animals, magical forests, or benevolent spirits. Focus on transformation and wonder.""",
            
            "meditation": """Create a meditative, contemplative narrative that guides the reader through a peaceful inner journey. Use sensory details, breathing imagery, and calming natural settings. The pace should be slow and reflective.""",
            
            "adventure": """Write an uplifting adventure story where the protagonist faces challenges and discovers inner strength. Include elements of courage, discovery, and personal growth. The journey should mirror therapeutic progress.""",
            
            "wisdom": """Tell a wisdom story in the tradition of ancient parables or teachings. Include a wise character who shares insights about life, healing, and growth. Focus on timeless truths and gentle guidance."""
        }
        
        prompt = f"""You are a master storyteller creating therapeutic stories for a healing app called HavenMind. 

User's Sanctuary Context:
{sanctuary_desc}

Recent emotional themes: {', '.join(recent_emotions[:5])}
Therapeutic themes identified: {', '.join(user_themes)}
Story theme to explore: {theme}
Story style: {story_style}

{style_instructions.get(story_style, style_instructions["allegory"])}

Story Requirements:
1. Length: 400-800 words
2. Include a clear title
3. Incorporate elements from the user's sanctuary naturally
4. Address the therapeutic theme of "{theme}"
5. End with hope, growth, or wisdom
6. Use inclusive, gentle language
7. Avoid dark or triggering content
8. Include sensory details and emotional resonance

Please write a complete story that will provide comfort, insight, and inspiration to someone on a healing journey."""

        return prompt
    
    def _create_sanctuary_description(self, sanctuary_elements: List[Dict]) -> str:
        """Create a narrative description of the user's sanctuary."""
        if not sanctuary_elements:
            return "A new sanctuary, full of potential and waiting to be filled with meaningful elements."
        
        element_counts = {}
        emotions_present = []
        
        for element in sanctuary_elements:
            element_type = element.get("element_type", "unknown")
            emotion = element.get("emotion", "neutral")
            
            element_counts[element_type] = element_counts.get(element_type, 0) + 1
            if emotion not in emotions_present:
                emotions_present.append(emotion)
        
        description = f"A sanctuary containing {len(sanctuary_elements)} meaningful elements: "
        
        element_descriptions = []
        for element_type, count in element_counts.items():
            if count == 1:
                element_descriptions.append(f"a {element_type}")
            else:
                element_descriptions.append(f"{count} {element_type}s")
        
        description += ", ".join(element_descriptions)
        description += f". The emotional landscape includes feelings of {', '.join(emotions_present[:4])}."
        
        return description
    
    async def _generate_story_content(self, prompt: str) -> Optional[str]:
        """Generate story content using AI services."""
        
        # Try Gemini first
        if self.gemini_model:
            try:
                response = await asyncio.to_thread(
                    self.gemini_model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=1000,
                        temperature=0.8,
                        top_p=0.9,
                    )
                )
                
                if response and response.text:
                    return response.text.strip()
                    
            except Exception as e:
                logger.error(f"Error with Gemini story generation: {e}")
        
        # Try Groq as fallback
        if self.groq_client:
            try:
                completion = await asyncio.to_thread(
                    self.groq_client.chat.completions.create,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a master storyteller creating therapeutic stories for emotional healing and growth."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    model="mixtral-8x7b-32768",
                    max_tokens=1000,
                    temperature=0.8,
                    top_p=0.9
                )
                
                if completion.choices and completion.choices[0].message:
                    return completion.choices[0].message.content.strip()
                    
            except Exception as e:
                logger.error(f"Error with Groq story generation: {e}")
        
        return None
    
    def _process_story_content(self, content: str, style: str, theme: str) -> Dict[str, Any]:
        """Process and structure the generated story content."""
        
        # Extract title if present
        title_match = re.search(r'^#\s*(.+)$|^Title:\s*(.+)$|^\*\*(.+)\*\*$', content, re.MULTILINE)
        
        if title_match:
            title = (title_match.group(1) or title_match.group(2) or title_match.group(3)).strip()
            # Remove title from content
            content = re.sub(r'^#\s*.+$|^Title:\s*.+$|^\*\*.+\*\*$', '', content, count=1, flags=re.MULTILINE).strip()
        else:
            title = self._generate_title(style, theme)
        
        # Calculate reading time (average 200 words per minute)
        word_count = len(content.split())
        reading_time = max(1, round(word_count / 200))
        
        # Clean up content
        content = self._clean_story_content(content)
        
        return {
            "title": title,
            "content": content,
            "style": style,
            "theme": theme,
            "reading_time": reading_time,
            "word_count": word_count
        }
    
    def _clean_story_content(self, content: str) -> str:
        """Clean and format story content."""
        # Remove excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # Ensure proper paragraph spacing
        paragraphs = content.split('\n\n')
        cleaned_paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        return '\n\n'.join(cleaned_paragraphs)
    
    def _generate_title(self, style: str, theme: str) -> str:
        """Generate a title based on style and theme."""
        
        style_titles = {
            "allegory": [
                "The Garden of Understanding",
                "The Bridge of Becoming", 
                "The Mirror of Truth",
                "The Lighthouse Within"
            ],
            "fairy_tale": [
                "The Enchanted Sanctuary",
                "The Wise Tree's Gift",
                "The Crystal of Healing",
                "The Magic of Growing"
            ],
            "meditation": [
                "A Journey to Stillness", 
                "Breathing with the Earth",
                "The Peaceful Path Within",
                "Moments of Grace"
            ],
            "adventure": [
                "The Quest for Inner Strength",
                "Journey to the Hidden Valley",
                "The Courage to Continue",
                "Adventure of the Heart"
            ],
            "wisdom": [
                "The Teacher Within",
                "Lessons from the Ancient Oak",
                "The Wisdom of Seasons",
                "Words from the Heart"
            ]
        }
        
        theme_titles = {
            "overcoming_challenges": ["Rising from the Storm", "The Mountain's Lesson"],
            "transformation_and_growth": ["The Butterfly's Promise", "Seeds of Change"],
            "finding_inner_light": ["The Candle Within", "Light in the Darkness"],
            "connection_and_belonging": ["The Circle of Hearts", "Finding Home"],
            "finding_peace_in_uncertainty": ["Dancing with the Unknown", "Peace in the Storm"],
            "the_healing_journey": ["Steps Toward Wholeness", "The Healing Garden"],
            "present_moment_awareness": ["The Gift of Now", "Here in This Moment"],
            "discovering_inner_wisdom": ["The Voice Within", "Ancient Knowing"]
        }
        
        # Try theme-specific title first
        if theme in theme_titles:
            return random.choice(theme_titles[theme])
        
        # Fall back to style-specific title
        return random.choice(style_titles.get(style, style_titles["wisdom"]))
    
    def _generate_fallback_story(self, style: str, theme: str, session_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a simple fallback story when AI generation fails."""
        
        fallback_stories = {
            "allegory": {
                "title": "The Garden of Patience",
                "content": """In a small village, there lived a gardener who tended to a most unusual garden. Unlike other gardens, this one grew not just flowers and vegetables, but emotions—each plant representing a feeling that had been carefully nurtured and understood.

One day, a traveler arrived, carrying heavy burdens of worry and sadness. "My garden grows only weeds," the traveler confessed. "Nothing beautiful seems to take root."

The wise gardener smiled and led the visitor through the sanctuary of growing things. "See this patch here?" she pointed to an area where delicate blue flowers swayed gently. "These grew from tears of sadness. And these golden blooms? They sprouted from moments of joy, however small."

"But how?" asked the traveler. "How do you make beauty from such difficult feelings?"

"I don't make them beautiful," the gardener replied. "I simply tend to them with patience and compassion. Every feeling, like every seed, contains within it the potential for growth and wisdom. The key is not to fight them, but to understand what they need to flourish."

The traveler spent many days learning to tend their own inner garden, discovering that even the most difficult emotions, when met with kindness, could transform into sources of strength and beauty. When they finally left, their step was lighter, carrying with them the seeds of self-compassion."""
            },
            "fairy_tale": {
                "title": "The Crystal of Healing Hearts",
                "content": """Once upon a time, in a realm where emotions took the form of gentle creatures, there lived a young person whose heart-creature had become very small and dim. The joy-butterflies no longer visited, and the peace-deer had wandered far away.

Feeling lost, they embarked on a journey to find the legendary Crystal of Healing Hearts, said to restore emotional balance to all who found it. Through forests of contemplation and valleys of reflection, they traveled, meeting other creatures along the way.

A wise owl shared the secret of breathing with the wind. A patient tortoise taught the art of moving slowly through difficult feelings. A family of rabbits showed how small moments of gratitude could light up even the darkest days.

As the journey continued, something wonderful began to happen. With each act of kindness toward themselves and others, the traveler's heart-creature grew brighter and stronger. The joy-butterflies returned, joined by new friends: courage-lions, compassion-bears, and hope-birds.

When they finally reached the legendary crystal, they found it was actually a mirror. In its surface, they saw the truth—the power to heal had been within them all along, growing stronger with each step of their journey. The real magic was learning to tend to their own heart with the same gentleness they showed others.

And so they returned home, not just healed, but transformed into a beacon of light for others who had lost their way."""
            }
        }
        
        # Get default story or create simple one
        default_story = fallback_stories.get(style, fallback_stories["allegory"])
        
        return {
            "title": default_story["title"],
            "content": default_story["content"],
            "style": style,
            "theme": theme,
            "reading_time": 3,
            "word_count": len(default_story["content"].split())
        }

# Global service instance  
story_service = StoryService()