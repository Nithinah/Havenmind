import httpx
import asyncio
import logging
import base64
import io
from PIL import Image, ImageDraw, ImageFilter
from typing import Optional, Dict, Any
from app.config import settings
import random
import math

logger = logging.getLogger(__name__)

class ImageGenerationService:
    def __init__(self):
        self.stability_api_key = settings.STABILITY_AI_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.max_retries = settings.MAX_IMAGE_GENERATION_RETRIES
        
    async def generate_sanctuary_image(
        self, 
        element_type: str, 
        emotion: str, 
        journal_entry: str,
        style: str = "fantasy-art"
    ) -> Optional[str]:
        """Generate sanctuary element image using Gemini API."""
        try:
            # Create enhanced prompt
            prompt = self._create_enhanced_prompt(element_type, emotion, journal_entry, style)
            
            if self.gemini_api_key:
                # Try Gemini API first (enhance prompt)
                enhanced_prompt = await self._enhance_prompt_with_gemini(prompt, journal_entry)
                if enhanced_prompt:
                    prompt = enhanced_prompt
            
            if self.stability_api_key:
                # Try Stability AI with enhanced prompt
                image_url = await self._generate_with_stability(prompt)
                if image_url:
                    return image_url
            
            # Final fallback to procedural generation
            logger.info("Falling back to procedural image generation")
            return await self._generate_procedural_image(element_type, emotion)
            
        except Exception as e:
            logger.error(f"Error generating sanctuary image: {e}")
            return await self._generate_procedural_image(element_type, emotion)
    
    async def generate_story_image(
        self, 
        story_content: str, 
        story_title: str = "", 
        style: str = "fantasy-art",
        theme: str = "adventure"
    ) -> Optional[str]:
        """Generate story background image using AI or high-quality fallback."""
        try:
            logger.info(f"🎨 Starting story image generation for: {story_title[:50]}")
            logger.info(f"🔑 Gemini API key available: {bool(self.gemini_api_key)}")
            logger.info(f"🔑 Stability AI key available: {bool(self.stability_api_key)}")
            
            # Create story-specific prompt
            prompt = self._create_story_prompt(story_content, story_title, style, theme)
            logger.info(f"📝 Base prompt: {prompt[:100]}...")
            
            # Use Gemini to enhance the prompt for better image generation
            if self.gemini_api_key:
                logger.info("🤖 Enhancing image prompt with Gemini AI")
                enhanced_prompt = await self._enhance_prompt_with_gemini(prompt, story_content)
                if enhanced_prompt:
                    prompt = enhanced_prompt
                    logger.info(f"✨ Enhanced prompt: {prompt[:100]}...")
                else:
                    logger.warning("⚠️ Gemini prompt enhancement failed")
            else:
                logger.warning("⚠️ Gemini API key not available")
            
            # Try Stability AI with enhanced prompt
            if self.stability_api_key:
                logger.info("🎨 Attempting to generate image with Stability AI")
                image_url = await self._generate_with_stability(prompt, image_type="story")
                if image_url:
                    logger.info("✅ Successfully generated image with Stability AI!")
                    return image_url
                else:
                    logger.warning("❌ Stability AI generation failed")
            else:
                logger.warning("⚠️ Stability AI key not available")
            
            # Use high-quality fallback
            logger.info("🔄 Using high-quality curated image fallback")
            return await self._generate_high_quality_fallback(story_content, story_title, theme)
            
        except Exception as e:
            logger.error(f"Error generating story image: {e}")
            return await self._generate_high_quality_fallback(story_content, story_title, theme)
    
    async def _generate_high_quality_fallback(self, story_content: str, story_title: str, theme: str) -> str:
        """Generate high-quality fallback image using curated image sources."""
        try:
            # Extract key visual elements from story content
            visual_elements = self._extract_visual_elements_for_fallback(story_content, theme)
            
            # Use Unsplash with carefully selected keywords for high-quality results
            primary_keyword = visual_elements.get('primary', 'fantasy landscape')
            secondary_keyword = visual_elements.get('secondary', 'cinematic')
            
            # Create high-quality Unsplash URL
            keywords = f"{primary_keyword},{secondary_keyword},{theme}"
            
            # Use specific collections or photographers known for high-quality fantasy/story images
            collections = "1114848,1127901,3356108"  # High-quality landscape/fantasy collections
            
            fallback_url = f"https://source.unsplash.com/1344x768/?{keywords}&collections={collections}"
            
            logger.info(f"Using high-quality fallback image: {fallback_url}")
            return fallback_url
            
        except Exception as e:
            logger.error(f"Error generating high-quality fallback: {e}")
            return "https://source.unsplash.com/1344x768/?fantasy,landscape,cinematic"
    
    def _extract_visual_elements_for_fallback(self, story_content: str, theme: str) -> dict:
        """Extract visual elements optimized for realistic image search."""
        content_lower = story_content.lower()
        
        # High-quality visual keywords for different themes
        theme_keywords = {
            "adventure": {
                "primary": "mountain landscape adventure",
                "secondary": "epic cinematic"
            },
            "mystery": {
                "primary": "dark forest mysterious",
                "secondary": "dramatic atmospheric"
            },
            "fantasy": {
                "primary": "magical forest fantasy",
                "secondary": "ethereal cinematic"
            },
            "romance": {
                "primary": "beautiful garden romantic",
                "secondary": "soft lighting"
            },
            "wisdom": {
                "primary": "ancient library wisdom",
                "secondary": "golden hour"
            }
        }
        
        # Location-based keywords
        location_mapping = {
            "forest": "dense forest trees",
            "castle": "medieval castle architecture", 
            "room": "elegant interior room",
            "classroom": "ancient library classroom",
            "school": "mystical academy interior",
            "hall": "grand hall architecture",
            "chamber": "ancient chamber interior",
            "library": "ancient library books",
            "temple": "sacred temple interior",
            "mountain": "mountain landscape vista",
            "ocean": "ocean waves seascape",
            "cave": "mysterious cave entrance",
            "garden": "beautiful garden flowers",
            "village": "medieval village town",
            "desert": "desert dunes landscape",
            "river": "flowing river nature"
        }
        
        # Character-based enhancements
        character_enhancements = {
            "traveler": "lone figure journey",
            "hero": "heroic silhouette",
            "teacher": "wise sage scholar",
            "sage": "wise elder",
            "warrior": "brave fighter",
            "student": "young learner seeker",
            "sam": "person figure silhouette"
        }
        
        # Extract primary visual element
        primary_visual = theme_keywords.get(theme, {}).get("primary", "fantasy landscape")
        secondary_visual = theme_keywords.get(theme, {}).get("secondary", "cinematic")
        
        # Check for specific locations
        for location, keyword in location_mapping.items():
            if location in content_lower:
                primary_visual = keyword
                break
        
        # Check for characters
        for character, enhancement in character_enhancements.items():
            if character in content_lower:
                secondary_visual = f"{secondary_visual} {enhancement}"
                break
        
        # Add atmospheric elements
        if "dark" in content_lower or "night" in content_lower:
            secondary_visual = f"{secondary_visual} night dramatic"
        elif "bright" in content_lower or "golden" in content_lower:
            secondary_visual = f"{secondary_visual} golden hour"
        elif "misty" in content_lower or "fog" in content_lower:
            secondary_visual = f"{secondary_visual} misty atmospheric"
        
        return {
            "primary": primary_visual,
            "secondary": secondary_visual
        }
    
    def _create_enhanced_prompt(self, element_type: str, emotion: str, journal_entry: str, style: str) -> str:
        """Create enhanced prompt for image generation."""
        # Base prompt templates
        element_descriptions = {
            "flower": "a beautiful, ethereal flower with delicate petals",
            "tree": "a majestic, ancient tree with flowing branches", 
            "crystal": "a luminous, mystical crystal formation",
            "butterfly": "a graceful butterfly with iridescent wings",
            "bird": "a serene bird perched peacefully",
            "plant": "a lush, verdant plant with vibrant leaves",
            "stone": "a smooth, weathered stone with natural patterns",
            "water": "flowing, crystalline water with gentle ripples",
            "cloud": "a soft, dreamy cloud formation",
            "rock": "a solid, grounding rock formation",
            "moss": "soft, green moss covering ancient surfaces",
            "mist": "ethereal mist swirling gently",
            "stream": "a peaceful stream with clear water",
            "cave": "a mystical cave entrance with soft lighting",
            "shadow": "gentle shadows creating depth and mystery",
            "wind": "visible air currents creating movement"
        }
        
        emotion_modifiers = {
            "joy": "radiating golden light, warm and uplifting",
            "love": "glowing with pink and rose tones, heart-warming",
            "gratitude": "surrounded by warm, amber light",
            "hope": "shimmering with silver and blue light",
            "calm": "emanating peaceful, soft blue energy",
            "sadness": "touched with gentle blue and purple hues",
            "anger": "flickering with controlled red energy",
            "fear": "shrouded in protective, dark tones",
            "anxiety": "surrounded by swirling, muted colors",
            "neutral": "balanced with natural, earth tones"
        }
        
        base_desc = element_descriptions.get(element_type, "a mystical sanctuary element")
        emotion_mod = emotion_modifiers.get(emotion, "with gentle, natural energy")
        
        # Extract key themes from journal entry
        themes = self._extract_visual_themes(journal_entry)
        theme_desc = f", embodying themes of {', '.join(themes)}" if themes else ""
        
        style_suffix = {
            "fantasy-art": ", fantasy art style, magical realism, soft lighting, 4k quality",
            "nature": ", natural photography style, organic, soft focus",
            "abstract": ", abstract art style, flowing forms, artistic interpretation",
            "watercolor": ", watercolor painting style, soft edges, artistic",
            "digital-art": ", digital art style, clean lines, modern aesthetic"
        }
        
        prompt = f"{base_desc} {emotion_mod}{theme_desc}{style_suffix.get(style, '')}"
        
        # Add quality and style modifiers
        prompt += ", peaceful sanctuary setting, therapeutic atmosphere, high quality, detailed"
        
        return prompt
    
    def _create_story_prompt(self, story_content: str, story_title: str, style: str, theme: str) -> str:
        """Create dynamic story-specific prompt based on actual story content."""
        # Extract key elements from the actual story content dynamically
        characters = self._extract_story_characters(story_content)
        settings = self._extract_story_settings(story_content)
        actions = self._extract_story_actions(story_content)
        emotions = self._extract_story_emotions(story_content)
        objects = self._extract_story_objects(story_content)
        
        # Build dynamic prompt from actual story elements
        prompt_parts = []
        
        # Add characters if found
        if characters:
            if len(characters) == 1:
                prompt_parts.append(f"a person named {characters[0]}")
            else:
                prompt_parts.append(f"people including {', '.join(characters[:2])}")
        
        # Add primary action/scene
        if actions:
            primary_action = actions[0]
            if "enter" in primary_action:
                prompt_parts.append("entering")
            elif "walk" in primary_action:
                prompt_parts.append("walking through")
            elif "sit" in primary_action:
                prompt_parts.append("seated in")
            elif "stand" in primary_action:
                prompt_parts.append("standing in")
            elif "discover" in primary_action:
                prompt_parts.append("discovering")
            elif "meet" in primary_action:
                prompt_parts.append("meeting with")
            else:
                prompt_parts.append(primary_action)
        
        # Add setting/location
        if settings:
            primary_setting = settings[0]
            prompt_parts.append(primary_setting)
        else:
            # Fallback based on theme if no specific setting found
            theme_settings = {
                "wisdom": "an ancient library or study",
                "adventure": "a mystical landscape",
                "mystery": "a shadowy, atmospheric place",
                "fantasy": "a magical realm",
                "meditation": "a peaceful, serene environment"
            }
            prompt_parts.append(theme_settings.get(theme, "a cinematic scene"))
        
        # Add emotional atmosphere
        if emotions:
            emotion_modifiers = {
                "wise": "with ancient wisdom and golden light",
                "peaceful": "with serene, calming atmosphere",
                "mysterious": "with dramatic shadows and intrigue",
                "magical": "with ethereal, mystical energy",
                "powerful": "with strength and determination",
                "gentle": "with soft, warm lighting",
                "ancient": "with timeless, sacred atmosphere"
            }
            for emotion in emotions:
                if emotion in emotion_modifiers:
                    prompt_parts.append(emotion_modifiers[emotion])
                    break
        
        # Add objects if significant
        if objects:
            significant_objects = [obj for obj in objects if obj in [
                "scroll", "book", "desk", "door", "window", "chair", "table", 
                "candle", "lamp", "mirror", "painting", "sword", "staff"
            ]]
            if significant_objects:
                prompt_parts.append(f"with {significant_objects[0]} visible")
        
        # Construct the main prompt
        base_prompt = " ".join(prompt_parts)
        
        # Add style-specific enhancements
        style_enhancements = {
            "fantasy-art": "fantasy art style, magical realism, cinematic lighting",
            "realistic": "photorealistic, natural lighting, detailed",
            "artistic": "artistic illustration, painterly style",
            "watercolor": "watercolor painting, soft edges, artistic",
            "digital-art": "digital art, clean composition, modern",
            "cinematic": "cinematic composition, dramatic lighting, film-like"
        }
        
        style_enhancement = style_enhancements.get(style, "cinematic lighting, artistic")
        
        # Add theme-specific atmosphere
        theme_atmospheres = {
            "adventure": "epic adventure atmosphere, heroic composition",
            "mystery": "mysterious atmosphere, dramatic shadows",
            "romance": "romantic lighting, soft warm tones",
            "fantasy": "magical fantasy world, ethereal elements",
            "wisdom": "scholarly atmosphere, golden hour lighting",
            "meditation": "peaceful, contemplative mood",
            "transformation_and_growth": "uplifting, transformative lighting",
            "connection_and_belonging": "warm, welcoming atmosphere"
        }
        
        theme_atmosphere = theme_atmospheres.get(theme, "atmospheric, cinematic")
        
        # Final prompt assembly
        final_prompt = f"{base_prompt}, {style_enhancement}, {theme_atmosphere}, high quality, detailed, immersive"
        
        # Clean up the prompt
        final_prompt = final_prompt.replace("  ", " ").strip()
        
        return final_prompt
    
    def _extract_story_characters(self, story_content: str) -> list:
        """Extract character names and descriptions from any story content dynamically."""
        characters = []
        text_lower = story_content.lower()
        text_original = story_content
        
        # Extract proper nouns that could be names (capitalized words)
        import re
        potential_names = re.findall(r'\b[A-Z][a-z]+\b', text_original)
        
        # Filter out common non-name words
        common_words = {
            'The', 'And', 'But', 'For', 'Or', 'A', 'An', 'This', 'That', 'With', 'Through',
            'Every', 'Story', 'They', 'Said', 'Your', 'Tale', 'Sam', 'Max', 'Alex', 'Jordan',
            'Ancient', 'Scroll', 'Wisdom', 'Ages', 'Truth', 'Classroom', 'Teacher', 'Contribution'
        }
        
        # Add actual names found in text
        for name in potential_names:
            if name not in common_words and len(name) > 2:
                # Check if it appears to be used as a name (preceded by common name indicators)
                name_patterns = [
                    rf'\b{name} (enters|walks|sits|stands|goes|comes|looks|speaks|says)',
                    rf'\b(said|called|named) {name}\b',
                    rf'\b{name}\'s\b',
                    rf'\b{name} (was|is|had|has)\b'
                ]
                
                for pattern in name_patterns:
                    if re.search(pattern, story_content, re.IGNORECASE):
                        characters.append(name)
                        break
        
        # Common character references
        character_references = {
            'teacher': 'wise teacher',
            'sage': 'ancient sage', 
            'student': 'student',
            'traveler': 'traveler',
            'hero': 'hero',
            'warrior': 'warrior',
            'guide': 'guide',
            'master': 'master',
            'scholar': 'scholar',
            'seeker': 'seeker',
            'wanderer': 'wanderer'
        }
        
        for ref, description in character_references.items():
            if ref in text_lower and description not in characters:
                characters.append(description)
        
        # Generic character indicators
        pronouns_found = []
        if re.search(r'\bhe\b|\bhim\b|\bhis\b', text_lower):
            pronouns_found.append('a man')
        if re.search(r'\bshe\b|\bher\b|\bhers\b', text_lower):
            pronouns_found.append('a woman')
        if re.search(r'\bthey\b|\bthem\b|\btheir\b', text_lower) and not characters:
            pronouns_found.append('people')
        
        # Add pronouns only if no specific characters found
        if not characters and pronouns_found:
            characters.extend(pronouns_found)
        
        return list(set(characters))[:3]  # Limit to 3 main characters
    
    def _extract_story_settings(self, story_content: str) -> list:
        """Extract setting descriptions from any story content dynamically."""
        settings = []
        text_lower = story_content.lower()
        
        # Comprehensive location detection
        location_keywords = {
            "classroom": ["classroom", "class", "school room"],
            "library": ["library", "archive", "book hall"],
            "forest": ["forest", "woods", "woodland", "trees", "grove"],
            "castle": ["castle", "fortress", "palace", "tower", "citadel"],
            "village": ["village", "town", "marketplace", "square", "hamlet"],
            "mountain": ["mountain", "peak", "cliff", "valley", "hill"],
            "ocean": ["ocean", "sea", "beach", "shore", "waves", "coast"],
            "cave": ["cave", "cavern", "underground", "tunnel", "grotto"],
            "room": ["room", "chamber", "hall", "study", "parlor"],
            "garden": ["garden", "meadow", "field", "flowers", "courtyard"],
            "city": ["city", "street", "urban", "buildings", "plaza"],
            "desert": ["desert", "sand", "dunes", "oasis", "wasteland"],
            "temple": ["temple", "shrine", "sanctuary", "sacred place"],
            "bridge": ["bridge", "crossing", "walkway"],
            "path": ["path", "road", "trail", "pathway", "route"],
            "door": ["doorway", "entrance", "threshold", "gate"],
            "window": ["window", "opening", "view"],
            "stairs": ["stairs", "staircase", "steps"],
            "attic": ["attic", "loft", "upper room"],
            "basement": ["basement", "cellar", "lower level"],
            "kitchen": ["kitchen", "dining room"],
            "bedroom": ["bedroom", "sleeping chamber"],
            "office": ["office", "workspace", "study"]
        }
        
        # Find all matching locations
        found_locations = []
        for location, keywords in location_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    if location == "room" and any(specific in text_lower for specific in ["class", "bed", "dining", "living"]):
                        continue  # Skip generic "room" if more specific room found
                    found_locations.append(location)
                    break
        
        # Convert to descriptive settings
        location_descriptions = {
            "classroom": "ancient classroom with wooden desks and mystical atmosphere",
            "library": "grand library with towering bookshelves",
            "forest": "mystical forest with ancient trees",
            "castle": "medieval castle with stone walls",
            "village": "quaint medieval village",
            "mountain": "majestic mountain landscape",
            "ocean": "vast ocean with rolling waves",
            "cave": "mysterious cave with natural formations",
            "room": "elegant interior room",
            "garden": "beautiful garden with flowers",
            "city": "bustling medieval city",
            "desert": "vast desert landscape",
            "temple": "sacred temple with ancient architecture",
            "bridge": "old stone bridge",
            "path": "winding path through nature",
            "door": "ornate doorway",
            "window": "arched window with view",
            "stairs": "grand staircase",
            "attic": "cozy attic space",
            "basement": "stone basement chamber",
            "kitchen": "rustic kitchen",
            "bedroom": "comfortable bedroom",
            "office": "scholarly study room"
        }
        
        # Add descriptions for found locations
        for location in found_locations:
            if location in location_descriptions:
                settings.append(location_descriptions[location])
        
        # Look for atmospheric descriptors
        atmosphere_indicators = {
            "ancient": "ancient",
            "old": "old",
            "dark": "shadowy",
            "bright": "brightly lit",
            "mysterious": "mysterious",
            "peaceful": "peaceful",
            "sacred": "sacred",
            "hidden": "hidden",
            "secret": "secret",
            "magical": "magical",
            "enchanted": "enchanted"
        }
        
        found_atmosphere = []
        for indicator, description in atmosphere_indicators.items():
            if indicator in text_lower:
                found_atmosphere.append(description)
        
        # Combine settings with atmosphere
        if settings and found_atmosphere:
            settings[0] = f"{found_atmosphere[0]} {settings[0]}"
        elif not settings and found_atmosphere:
            settings.append(f"{found_atmosphere[0]} interior space")
        elif not settings:
            # Default atmospheric setting
            settings.append("cinematic interior scene")
        
        return settings[:2]  # Return top 2 settings
    
    def _extract_story_actions(self, story_content: str) -> list:
        """Extract key actions from any story content dynamically."""
        actions = []
        text_lower = story_content.lower()
        
        # Comprehensive action detection
        action_patterns = {
            "entering": r'\b(enter|enters|entering|walked into|steps into|goes into)\b',
            "walking": r'\b(walk|walks|walking|stroll|strolls|pace|paces)\b',
            "sitting": r'\b(sit|sits|sitting|seated|settles)\b',
            "standing": r'\b(stand|stands|standing|stood|rise|rises)\b',
            "looking": r'\b(look|looks|looking|gaze|gazes|stare|stares)\b',
            "speaking": r'\b(speak|speaks|speaking|talk|talks|say|says|said)\b',
            "smiling": r'\b(smile|smiles|smiling|grin|grins)\b',
            "gesturing": r'\b(gesture|gestures|gesturing|point|points|wave|waves)\b',
            "reading": r'\b(read|reads|reading|study|studies|examine|examines)\b',
            "writing": r'\b(write|writes|writing|scribe|scribes)\b',
            "discovering": r'\b(discover|discovers|find|finds|uncover|uncovers)\b',
            "exploring": r'\b(explore|explores|exploring|search|searches|investigate)\b',
            "meeting": r'\b(meet|meets|meeting|encounter|encounters|greet|greets)\b',
            "learning": r'\b(learn|learns|learning|understand|understands|realize|realizes)\b',
            "teaching": r'\b(teach|teaches|teaching|instruct|instructs|guide|guides)\b',
            "traveling": r'\b(travel|travels|traveling|journey|journeys|move|moves)\b',
            "opening": r'\b(open|opens|opening|unlock|unlocks)\b',
            "closing": r'\b(close|closes|closing|shut|shuts)\b',
            "creating": r'\b(create|creates|creating|make|makes|build|builds)\b',
            "transforming": r'\b(transform|transforms|change|changes|become|becomes)\b'
        }
        
        import re
        found_actions = []
        for action, pattern in action_patterns.items():
            if re.search(pattern, text_lower):
                found_actions.append(action)
        
        # Prioritize more specific actions
        action_priority = [
            "entering", "discovering", "transforming", "teaching", "learning", 
            "meeting", "creating", "gesturing", "smiling", "speaking",
            "reading", "writing", "exploring", "traveling", "opening",
            "walking", "standing", "sitting", "looking", "closing"
        ]
        
        # Sort found actions by priority
        prioritized_actions = []
        for priority_action in action_priority:
            if priority_action in found_actions:
                prioritized_actions.append(priority_action)
        
        # Add any remaining actions not in priority list
        for action in found_actions:
            if action not in prioritized_actions:
                prioritized_actions.append(action)
        
        return prioritized_actions[:2]  # Return top 2 actions
    
    def _extract_story_emotions(self, story_content: str) -> list:
        """Extract emotional atmosphere from story content."""
        emotions = []
        text_lower = story_content.lower()
        
        emotion_keywords = {
            "wise": ["wise", "wisdom", "sage", "ancient", "knowing"],
            "peaceful": ["peaceful", "calm", "serene", "tranquil", "still"],
            "mysterious": ["mysterious", "mystery", "enigmatic", "cryptic"],
            "magical": ["magical", "mystical", "enchanted", "ethereal"],
            "powerful": ["powerful", "strong", "mighty", "commanding"],
            "gentle": ["gentle", "soft", "tender", "kind"],
            "ancient": ["ancient", "old", "timeless", "eternal"],
            "sacred": ["sacred", "holy", "blessed", "divine"],
            "warm": ["warm", "cozy", "welcoming", "comfortable"],
            "dramatic": ["dramatic", "intense", "striking", "bold"]
        }
        
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                emotions.append(emotion)
        
        return emotions[:2]  # Return top 2 emotions
    
    def _extract_story_objects(self, story_content: str) -> list:
        """Extract significant objects from story content."""
        objects = []
        text_lower = story_content.lower()
        
        significant_objects = {
            "scroll": ["scroll", "parchment", "manuscript"],
            "book": ["book", "tome", "volume", "text"],
            "desk": ["desk", "table", "surface"],
            "chair": ["chair", "seat", "throne"],
            "door": ["door", "doorway", "entrance", "portal"],
            "window": ["window", "opening"],
            "candle": ["candle", "flame", "light"],
            "lamp": ["lamp", "lantern", "torch"],
            "mirror": ["mirror", "reflection", "glass"],
            "painting": ["painting", "portrait", "artwork"],
            "staff": ["staff", "wand", "rod"],
            "crystal": ["crystal", "gem", "jewel"],
            "tree": ["tree", "oak", "pine", "willow"],
            "flower": ["flower", "rose", "bloom", "blossom"],
            "stone": ["stone", "rock", "boulder"],
            "water": ["water", "stream", "river", "pond"]
        }
        
        for obj, keywords in significant_objects.items():
            if any(keyword in text_lower for keyword in keywords):
                objects.append(obj)
        
        return objects[:3]  # Return top 3 objects
    
    def _extract_visual_themes(self, journal_entry: str) -> list:
        """Extract visual themes from journal entry for image generation."""
        themes = []
        text_lower = journal_entry.lower()
        
        visual_themes = {
            "growth": ["growing", "blooming", "flourishing"],
            "strength": ["strong", "powerful", "resilient"],
            "peace": ["peaceful", "calm", "serene"], 
            "transformation": ["changing", "becoming", "evolving"],
            "connection": ["together", "connected", "unity"],
            "healing": ["healing", "recovery", "restoration"],
            "freedom": ["free", "liberated", "soaring"],
            "protection": ["safe", "protected", "sheltered"]
        }
        
        for theme, keywords in visual_themes.items():
            if any(keyword in text_lower for keyword in keywords):
                themes.append(theme)
        
        return themes[:3]  # Limit to 3 themes
    
    async def _enhance_prompt_with_gemini(self, base_prompt: str, story_content: str) -> Optional[str]:
        """Use Gemini to enhance image generation prompts for better visual quality."""
        try:
            if not self.gemini_api_key:
                logger.warning("Gemini API key not configured")
                return None
            
            # Create a request to Gemini to enhance the image prompt
            enhancement_request = {
                "contents": [{
                    "parts": [{
                        "text": f"""You are an expert at creating detailed, cinematic image generation prompts. 

Analyze this story content and create a vivid visual scene:
Story Content: "{story_content}"
Basic Prompt: "{base_prompt}"

Instructions:
1. Read the story content carefully and identify the key visual elements:
   - Who are the characters? (names, descriptions, roles)
   - Where does this scene take place? (specific location, atmosphere)
   - What is happening? (actions, interactions, emotions)
   - What objects or details are important?

2. Create a detailed image prompt that includes:
   - Character descriptions (age, appearance, clothing, pose)
   - Specific setting details (architecture, furniture, lighting, atmosphere)
   - Mood and lighting (golden hour, candlelight, natural light, shadows)
   - Artistic style (cinematic, realistic, fantasy art, dramatic)
   - Color palette (warm/cool tones, specific colors mentioned)
   - Composition (foreground/background, perspective, depth of field)

3. Make it cinematic and atmospheric while staying true to the story content.
4. Focus on creating a scene that feels alive and immersive.
5. If characters are mentioned by name, include them naturally in the scene.

Example of good prompt style:
"A wise elderly teacher with gentle eyes and flowing robes, sitting behind an ornate wooden desk in an ancient library, gesturing toward an illuminated scroll, warm golden candlelight casting soft shadows, cinematic composition, fantasy art style, detailed and atmospheric"

Return only the enhanced visual prompt, nothing else."""
                    }]
                }]
            }
            
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": self.gemini_api_key
            }
            
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
            
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(url, json=enhancement_request, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("candidates") and len(data["candidates"]) > 0:
                        enhanced_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        logger.info(f"Gemini enhanced prompt: {enhanced_text[:100]}...")
                        return enhanced_text
                    else:
                        logger.warning("No candidates in Gemini response")
                        return None
                else:
                    logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error enhancing prompt with Gemini: {e}")
            return None
    
    async def _generate_with_stability(self, prompt: str, image_type: str = "sanctuary") -> Optional[str]:
        """Generate image using Stability AI API."""
        try:
            if not self.stability_api_key:
                logger.warning("⚠️ Stability AI API key not configured")
                return None
            
            logger.info(f"🔗 Connecting to Stability AI API...")
            url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
            
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json", 
                "Authorization": f"Bearer {self.stability_api_key}"
            }
            
            # Adjust parameters based on image type
            if image_type == "story":
                width, height = 1344, 768  # Valid SDXL dimension for story scenes
                style_preset = "cinematic"
                cfg_scale = 8
                steps = 40  # More steps for better quality
            else:
                width, height = 1024, 1024  # Valid SDXL dimension for sanctuary elements
                style_preset = "fantasy-art"
                cfg_scale = 7
                steps = 30
            
            # Enhanced negative prompt for better quality
            negative_prompt = "blurry, low quality, distorted, ugly, nsfw, violent, text, watermark, cartoon, anime, childish, simple shapes, geometric, abstract art, low resolution, pixelated, artifact"
            
            body = {
                "text_prompts": [
                    {
                        "text": f"{prompt}, photorealistic, highly detailed, professional photography, cinematic lighting, 8k resolution, masterpiece",
                        "weight": 1
                    },
                    {
                        "text": negative_prompt,
                        "weight": -1
                    }
                ],
                "cfg_scale": cfg_scale,
                "height": height,
                "width": width,
                "samples": 1,
                "steps": steps,
                "style_preset": style_preset,
                "seed": 0  # Random seed for variety
            }
            
            async with httpx.AsyncClient(timeout=120) as client:  # Increased timeout
                logger.info(f"🎨 Generating image with Stability AI...")
                logger.info(f"📝 Prompt: {prompt[:100]}...")
                logger.info(f"⚙️ Settings: {width}x{height}, {steps} steps, {style_preset} style")
                
                response = await client.post(url, headers=headers, json=body)
                
                logger.info(f"📡 Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("artifacts"):
                        image_data = data["artifacts"][0]["base64"]
                        logger.info("✅ Successfully generated image with Stability AI")
                        return f"data:image/png;base64,{image_data}"
                    else:
                        logger.error("❌ No artifacts in Stability AI response")
                elif response.status_code == 402:
                    logger.error("❌ Stability AI API: Insufficient credits")
                elif response.status_code == 429:
                    logger.error("❌ Stability AI API: Rate limit exceeded")
                else:
                    logger.error(f"❌ Stability AI API error: {response.status_code}")
                    logger.error(f"📋 Error details: {response.text[:500]}")
                
                return None
                    
        except Exception as e:
            logger.error(f"❌ Error with Stability AI generation: {e}")
            return None
    
    async def _generate_procedural_story_image(self, story_content: str, theme: str) -> str:
        """Generate procedural story image when AI generation is not available."""
        try:
            # Create image canvas with story aspect ratio
            size = (1024, 768)
            image = Image.new('RGBA', size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(image)
            
            # Get theme-based colors
            color_palette = self._get_story_theme_colors(theme)
            
            # Draw background based on story content
            settings = self._extract_story_settings(story_content)
            if settings:
                setting_type = settings[0].split()[-1] if settings else "landscape"
                self._draw_story_background(draw, size, color_palette, setting_type)
            else:
                self._draw_story_background(draw, size, color_palette, "landscape")
            
            # Add atmospheric elements
            self._add_story_atmosphere(draw, size, color_palette, theme)
            
            # Apply theme-based filters
            image = self._apply_story_mood_filter(image, theme)
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Error generating procedural story image: {e}")
            return self._generate_fallback_story_image()
    
    def _get_story_theme_colors(self, theme: str) -> Dict[str, tuple]:
        """Get color palette based on story theme."""
        palettes = {
            "adventure": {
                "primary": (34, 139, 34),     # Forest green
                "secondary": (255, 215, 0),   # Gold
                "accent": (70, 130, 180),     # Steel blue
                "background": (135, 206, 235)  # Sky blue
            },
            "mystery": {
                "primary": (75, 0, 130),      # Indigo
                "secondary": (128, 0, 128),   # Purple
                "accent": (169, 169, 169),    # Dark gray
                "background": (25, 25, 112)   # Midnight blue
            },
            "fantasy": {
                "primary": (148, 0, 211),     # Dark violet
                "secondary": (255, 20, 147),  # Deep pink
                "accent": (0, 255, 255),      # Cyan
                "background": (72, 61, 139)   # Dark slate blue
            },
            "romance": {
                "primary": (255, 182, 193),   # Light pink
                "secondary": (255, 105, 180), # Hot pink
                "accent": (255, 228, 225),    # Misty rose
                "background": (255, 240, 245)  # Lavender blush
            }
        }
        
        return palettes.get(theme, {
            "primary": (34, 139, 34),     # Default green
            "secondary": (255, 215, 0),   # Gold
            "accent": (135, 206, 235),    # Sky blue
            "background": (240, 248, 255) # Alice blue
        })
    
    def _draw_story_background(self, draw, size, colors, setting_type):
        """Draw story background based on setting type."""
        width, height = size
        
        # Fill background
        draw.rectangle([0, 0, width, height], fill=colors["background"])
        
        if "forest" in setting_type:
            self._draw_forest_background(draw, size, colors)
        elif "castle" in setting_type:
            self._draw_castle_background(draw, size, colors)
        elif "room" in setting_type:
            self._draw_room_background(draw, size, colors)
        elif "mountain" in setting_type:
            self._draw_mountain_background(draw, size, colors)
        elif "ocean" in setting_type:
            self._draw_ocean_background(draw, size, colors)
        else:
            self._draw_landscape_background(draw, size, colors)
    
    def _draw_forest_background(self, draw, size, colors):
        """Draw forest background."""
        width, height = size
        
        # Draw ground
        draw.rectangle([0, height * 0.7, width, height], fill=colors["secondary"])
        
        # Draw trees
        for i in range(5):
            x = (width // 6) * (i + 1)
            tree_height = random.randint(100, 200)
            trunk_width = 20
            
            # Trunk
            draw.rectangle([x - trunk_width//2, height - tree_height, 
                           x + trunk_width//2, height], fill=colors["accent"])
            
            # Crown
            crown_size = random.randint(40, 80)
            draw.ellipse([x - crown_size, height - tree_height - crown_size//2,
                         x + crown_size, height - tree_height + crown_size//2], 
                        fill=colors["primary"])
    
    def _draw_castle_background(self, draw, size, colors):
        """Draw castle background."""
        width, height = size
        
        # Draw ground
        draw.rectangle([0, height * 0.8, width, height], fill=colors["accent"])
        
        # Draw castle silhouette
        castle_width = width // 3
        castle_height = height // 2
        castle_x = width // 2 - castle_width // 2
        castle_y = height - castle_height
        
        draw.rectangle([castle_x, castle_y, castle_x + castle_width, height], 
                      fill=colors["secondary"])
        
        # Draw towers
        tower_width = castle_width // 4
        for i in range(3):
            tower_x = castle_x + i * (castle_width // 3)
            tower_height = random.randint(castle_height // 2, castle_height)
            draw.rectangle([tower_x, castle_y - tower_height//2, 
                           tower_x + tower_width, castle_y], 
                          fill=colors["primary"])
    
    def _draw_room_background(self, draw, size, colors):
        """Draw room background."""
        width, height = size
        
        # Draw floor
        draw.rectangle([0, height * 0.7, width, height], fill=colors["accent"])
        
        # Draw walls with perspective
        # Left wall
        draw.polygon([0, 0, width * 0.2, height * 0.2, width * 0.2, height * 0.8, 0, height], 
                    fill=colors["secondary"])
        
        # Back wall
        draw.rectangle([width * 0.2, height * 0.2, width * 0.8, height * 0.8], 
                      fill=colors["primary"])
        
        # Right wall
        draw.polygon([width, 0, width * 0.8, height * 0.2, width * 0.8, height * 0.8, width, height], 
                    fill=colors["secondary"])
    
    def _draw_mountain_background(self, draw, size, colors):
        """Draw mountain background."""
        width, height = size
        
        # Draw sky gradient (simplified)
        for i in range(height // 2):
            alpha = i / (height // 2)
            color = tuple(int(colors["background"][j] * (1 - alpha) + colors["accent"][j] * alpha) for j in range(3))
            draw.line([0, i, width, i], fill=color)
        
        # Draw mountain silhouettes
        for layer in range(3):
            mountain_height = height // 3 + layer * 50
            points = [0, height - mountain_height]
            
            for i in range(0, width, 100):
                peak_height = random.randint(mountain_height - 50, mountain_height + 50)
                points.extend([i, height - peak_height])
            
            points.extend([width, height - mountain_height, width, height, 0, height])
            
            alpha = 100 + layer * 50
            color = (*colors["primary"], alpha) if len(colors["primary"]) == 3 else colors["primary"]
            draw.polygon(points, fill=color[:3])
    
    def _draw_ocean_background(self, draw, size, colors):
        """Draw ocean background."""
        width, height = size
        
        # Draw sky
        draw.rectangle([0, 0, width, height * 0.4], fill=colors["background"])
        
        # Draw ocean with waves
        for i in range(height * 2 // 5, height, 10):
            wave_color = tuple(min(255, c + random.randint(-30, 30)) for c in colors["primary"][:3])
            points = []
            for x in range(0, width, 20):
                wave_y = i + math.sin(x * 0.02 + i * 0.1) * 5
                points.extend([x, wave_y])
            
            if len(points) >= 4:
                points.extend([width, height, 0, height])
                draw.polygon(points, fill=wave_color)
    
    def _draw_landscape_background(self, draw, size, colors):
        """Draw general landscape background."""
        width, height = size
        
        # Draw ground
        draw.rectangle([0, height * 0.6, width, height], fill=colors["secondary"])
        
        # Draw hills
        for i in range(3):
            hill_points = []
            y_base = height * 0.6 + i * 20
            
            for x in range(0, width, 50):
                hill_y = y_base - math.sin(x * 0.01 + i) * 30
                hill_points.extend([x, hill_y])
            
            hill_points.extend([width, height, 0, height])
            draw.polygon(hill_points, fill=colors["primary"])
    
    def _add_story_atmosphere(self, draw, size, colors, theme):
        """Add atmospheric elements based on theme."""
        width, height = size
        
        if theme == "mystery":
            # Add mist/fog effects
            for i in range(5):
                mist_x = random.randint(0, width)
                mist_y = random.randint(height // 2, height)
                mist_size = random.randint(50, 150)
                
                # Draw semi-transparent mist
                draw.ellipse([mist_x - mist_size, mist_y - mist_size//2,
                             mist_x + mist_size, mist_y + mist_size//2],
                            fill=(*colors["accent"][:3], 100) if len(colors["accent"]) == 3 else colors["accent"])
        
        elif theme == "fantasy":
            # Add magical sparkles
            for i in range(20):
                spark_x = random.randint(0, width)
                spark_y = random.randint(0, height)
                spark_size = random.randint(2, 8)
                
                draw.ellipse([spark_x - spark_size, spark_y - spark_size,
                             spark_x + spark_size, spark_y + spark_size],
                            fill=colors["accent"])
        
        elif theme == "adventure":
            # Add clouds
            for i in range(3):
                cloud_x = random.randint(width // 4, 3 * width // 4)
                cloud_y = random.randint(height // 8, height // 3)
                cloud_size = random.randint(40, 80)
                
                draw.ellipse([cloud_x - cloud_size, cloud_y - cloud_size//2,
                             cloud_x + cloud_size, cloud_y + cloud_size//2],
                            fill=(255, 255, 255, 150))
    
    def _apply_story_mood_filter(self, image: Image.Image, theme: str) -> Image.Image:
        """Apply mood-based filters to story image."""
        if theme == "mystery":
            image = image.filter(ImageFilter.GaussianBlur(radius=0.5))
        elif theme == "adventure":
            image = image.filter(ImageFilter.SHARPEN)
        elif theme == "romance":
            # Soft focus effect
            image = image.filter(ImageFilter.GaussianBlur(radius=0.3))
        elif theme == "fantasy":
            image = image.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
        return image
    
    def _generate_fallback_story_image(self) -> str:
        """Generate a simple fallback story image."""
        size = (1024, 768)
        image = Image.new('RGBA', size, (135, 206, 235, 255))  # Sky blue background
        draw = ImageDraw.Draw(image)
        
        # Draw simple landscape
        # Ground
        draw.rectangle([0, size[1] * 0.7, size[0], size[1]], fill=(34, 139, 34))  # Green
        
        # Sun
        sun_size = 40
        draw.ellipse([size[0] - 100, 50, size[0] - 20, 130], fill=(255, 215, 0))
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    async def _generate_procedural_image(self, element_type: str, emotion: str) -> str:
        """Generate procedural image when AI generation is not available."""
        try:
            # Create image canvas
            size = (512, 512)
            image = Image.new('RGBA', size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(image)
            
            # Get emotion-based colors
            color_palette = self._get_emotion_colors(emotion)
            
            # Draw element based on type
            if element_type in ["flower", "plant"]:
                self._draw_flower(draw, size, color_palette)
            elif element_type == "tree":
                self._draw_tree(draw, size, color_palette)
            elif element_type == "crystal":
                self._draw_crystal(draw, size, color_palette)
            elif element_type in ["butterfly", "bird"]:
                self._draw_creature(draw, size, color_palette, element_type)
            elif element_type in ["stone", "rock"]:
                self._draw_stone(draw, size, color_palette)
            elif element_type == "water":
                self._draw_water(draw, size, color_palette)
            else:
                self._draw_abstract(draw, size, color_palette)
            
            # Apply filters for mood
            image = self._apply_mood_filter(image, emotion)
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Error generating procedural image: {e}")
            return self._generate_fallback_image()
    
    def _get_emotion_colors(self, emotion: str) -> Dict[str, tuple]:
        """Get color palette based on emotion."""
        palettes = {
            "joy": {
                "primary": (255, 215, 0),    # Gold
                "secondary": (255, 165, 0),  # Orange
                "accent": (255, 255, 224)    # Light yellow
            },
            "love": {
                "primary": (255, 182, 193),  # Light pink
                "secondary": (255, 105, 180), # Hot pink
                "accent": (255, 228, 225)    # Misty rose
            },
            "calm": {
                "primary": (173, 216, 230),  # Light blue
                "secondary": (176, 196, 222), # Light steel blue
                "accent": (240, 248, 255)    # Alice blue
            },
            "sadness": {
                "primary": (70, 130, 180),   # Steel blue
                "secondary": (100, 149, 237), # Cornflower blue
                "accent": (176, 196, 222)    # Light steel blue
            },
            "anxiety": {
                "primary": (128, 128, 128),  # Gray
                "secondary": (105, 105, 105), # Dim gray
                "accent": (211, 211, 211)    # Light gray
            }
        }
        
        return palettes.get(emotion, {
            "primary": (144, 238, 144),   # Light green
            "secondary": (152, 251, 152), # Pale green
            "accent": (240, 255, 240)     # Honeydew
        })
    
    def _draw_flower(self, draw, size, colors):
        """Draw a procedural flower."""
        center_x, center_y = size[0] // 2, size[1] // 2
        
        # Draw petals
        petal_count = random.randint(5, 8)
        petal_size = random.randint(40, 80)
        
        for i in range(petal_count):
            angle = (2 * math.pi * i) / petal_count
            petal_x = center_x + math.cos(angle) * 30
            petal_y = center_y + math.sin(angle) * 30
            
            draw.ellipse([
                petal_x - petal_size//2, petal_y - petal_size//2,
                petal_x + petal_size//2, petal_y + petal_size//2
            ], fill=colors["primary"], outline=colors["secondary"], width=2)
        
        # Draw center
        draw.ellipse([
            center_x - 15, center_y - 15,
            center_x + 15, center_y + 15
        ], fill=colors["accent"], outline=colors["secondary"], width=1)
    
    def _draw_tree(self, draw, size, colors):
        """Draw a procedural tree."""
        center_x = size[0] // 2
        bottom = size[1] - 50
        
        # Draw trunk
        trunk_width = 30
        trunk_height = 150
        draw.rectangle([
            center_x - trunk_width//2, bottom - trunk_height,
            center_x + trunk_width//2, bottom
        ], fill=colors["secondary"])
        
        # Draw crown
        crown_radius = random.randint(60, 100)
        crown_center_y = bottom - trunk_height - crown_radius//2
        
        draw.ellipse([
            center_x - crown_radius, crown_center_y - crown_radius//2,
            center_x + crown_radius, crown_center_y + crown_radius//2
        ], fill=colors["primary"], outline=colors["accent"], width=3)
    
    def _draw_crystal(self, draw, size, colors):
        """Draw a procedural crystal."""
        center_x, center_y = size[0] // 2, size[1] // 2
        
        # Draw crystal facets
        points = []
        sides = 6
        radius = random.randint(60, 100)
        
        for i in range(sides):
            angle = (2 * math.pi * i) / sides
            x = center_x + math.cos(angle) * radius
            y = center_y + math.sin(angle) * radius
            points.extend([x, y])
        
        draw.polygon(points, fill=colors["primary"], outline=colors["secondary"], width=3)
        
        # Add inner reflection
        inner_points = []
        for i in range(sides):
            angle = (2 * math.pi * i) / sides
            x = center_x + math.cos(angle) * radius * 0.5
            y = center_y + math.sin(angle) * radius * 0.5
            inner_points.extend([x, y])
        
        draw.polygon(inner_points, fill=colors["accent"])
    
    def _draw_creature(self, draw, size, colors, creature_type):
        """Draw a procedural creature (butterfly or bird)."""
        center_x, center_y = size[0] // 2, size[1] // 2
        
        if creature_type == "butterfly":
            # Draw butterfly wings
            wing_size = 50
            
            # Upper wings
            draw.ellipse([center_x - wing_size, center_y - wing_size//2,
                         center_x, center_y + wing_size//2], 
                        fill=colors["primary"], outline=colors["secondary"], width=2)
            draw.ellipse([center_x, center_y - wing_size//2,
                         center_x + wing_size, center_y + wing_size//2],
                        fill=colors["primary"], outline=colors["secondary"], width=2)
            
            # Lower wings (smaller)
            wing_size_lower = 35
            draw.ellipse([center_x - wing_size_lower, center_y + 10,
                         center_x, center_y + wing_size_lower + 10],
                        fill=colors["accent"], outline=colors["secondary"], width=2)
            draw.ellipse([center_x, center_y + 10,
                         center_x + wing_size_lower, center_y + wing_size_lower + 10],
                        fill=colors["accent"], outline=colors["secondary"], width=2)
            
            # Body
            draw.ellipse([center_x - 3, center_y - 30,
                         center_x + 3, center_y + 30],
                        fill=colors["secondary"])
        
        else:  # bird
            # Draw bird body
            body_width, body_height = 40, 25
            draw.ellipse([center_x - body_width//2, center_y - body_height//2,
                         center_x + body_width//2, center_y + body_height//2],
                        fill=colors["primary"], outline=colors["secondary"], width=2)
            
            # Draw wing
            draw.ellipse([center_x - 15, center_y - 35,
                         center_x + 15, center_y - 5],
                        fill=colors["accent"], outline=colors["secondary"], width=1)
    
    def _draw_stone(self, draw, size, colors):
        """Draw a procedural stone."""
        center_x, center_y = size[0] // 2, size[1] // 2
        
        # Create irregular stone shape
        points = []
        vertices = random.randint(6, 10)
        base_radius = random.randint(50, 80)
        
        for i in range(vertices):
            angle = (2 * math.pi * i) / vertices
            radius_variation = random.uniform(0.7, 1.3)
            radius = base_radius * radius_variation
            x = center_x + math.cos(angle) * radius
            y = center_y + math.sin(angle) * radius
            points.extend([x, y])
        
        draw.polygon(points, fill=colors["primary"], outline=colors["secondary"], width=2)
        
        # Add texture lines
        for _ in range(3):
            start_x = random.randint(center_x - 30, center_x + 30)
            start_y = random.randint(center_y - 30, center_y + 30)
            end_x = start_x + random.randint(-20, 20)
            end_y = start_y + random.randint(-20, 20)
            draw.line([start_x, start_y, end_x, end_y], fill=colors["accent"], width=2)
    
    def _draw_water(self, draw, size, colors):
        """Draw procedural water."""
        # Draw flowing water with curves
        for i in range(5):
            y = size[1] // 2 + (i - 2) * 15
            points = []
            for x in range(0, size[0], 20):
                wave_y = y + math.sin(x * 0.02 + i) * 10
                points.extend([x, wave_y])
            
            if len(points) >= 4:
                draw.line(points, fill=colors["primary"], width=8)
                draw.line(points, fill=colors["accent"], width=4)
    
    def _draw_abstract(self, draw, size, colors):
        """Draw abstract shapes."""
        center_x, center_y = size[0] // 2, size[1] // 2
        
        # Draw flowing abstract shapes
        for i in range(3):
            offset_x = random.randint(-50, 50)
            offset_y = random.randint(-50, 50)
            radius = random.randint(30, 60)
            
            draw.ellipse([
                center_x + offset_x - radius, center_y + offset_y - radius,
                center_x + offset_x + radius, center_y + offset_y + radius
            ], fill=(*colors["primary"][:3], 128))  # Semi-transparent
    
    def _apply_mood_filter(self, image: Image.Image, emotion: str) -> Image.Image:
        """Apply mood-based filters to image."""
        if emotion in ["calm", "peace"]:
            image = image.filter(ImageFilter.GaussianBlur(radius=0.5))
        elif emotion in ["anxiety", "worry"]:
            image = image.filter(ImageFilter.EDGE_ENHANCE_MORE)
        elif emotion in ["joy", "excitement"]:
            # Increase saturation effect (simplified)
            pass
        elif emotion in ["sadness", "melancholy"]:
            # Desaturate effect (simplified)
            pass
        
        return image
    
    def _generate_fallback_image(self) -> str:
        """Generate a simple fallback image."""
        size = (512, 512)
        image = Image.new('RGBA', size, (200, 200, 200, 255))
        draw = ImageDraw.Draw(image)
        
        # Draw simple circle
        center = size[0] // 2
        radius = 50
        draw.ellipse([
            center - radius, center - radius,
            center + radius, center + radius
        ], fill=(150, 150, 150), outline=(100, 100, 100), width=3)
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"

# Global service instance
image_generation_service = ImageGenerationService()