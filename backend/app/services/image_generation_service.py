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
        self.max_retries = settings.MAX_IMAGE_GENERATION_RETRIES
        
    async def generate_sanctuary_image(
        self, 
        element_type: str, 
        emotion: str, 
        journal_entry: str,
        style: str = "fantasy-art"
    ) -> Optional[str]:
        """Generate sanctuary element image using Stability AI."""
        try:
            # Create enhanced prompt
            prompt = self._create_enhanced_prompt(element_type, emotion, journal_entry, style)
            
            if self.stability_api_key:
                # Try Stability AI first
                image_url = await self._generate_with_stability(prompt)
                if image_url:
                    return image_url
            
            # Fallback to procedural generation
            logger.info("Falling back to procedural image generation")
            return await self._generate_procedural_image(element_type, emotion)
            
        except Exception as e:
            logger.error(f"Error generating sanctuary image: {e}")
            return await self._generate_procedural_image(element_type, emotion)
    
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
    
    async def _generate_with_stability(self, prompt: str) -> Optional[str]:
        """Generate image using Stability AI API."""
        try:
            url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
            
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json", 
                "Authorization": f"Bearer {self.stability_api_key}"
            }
            
            body = {
                "text_prompts": [
                    {
                        "text": prompt,
                        "weight": 1
                    },
                    {
                        "text": "blurry, bad quality, distorted, ugly, nsfw, violent",
                        "weight": -1
                    }
                ],
                "cfg_scale": 7,
                "height": 512,
                "width": 512,
                "samples": 1,
                "steps": 30,
                "style_preset": "fantasy-art"
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(url, headers=headers, json=body)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("artifacts"):
                        # Convert base64 to image URL (you'd typically save this to storage)
                        image_data = data["artifacts"][0]["base64"]
                        # For demo, return a placeholder URL
                        return f"data:image/png;base64,{image_data}"
                else:
                    logger.error(f"Stability AI API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error with Stability AI generation: {e}")
            return None
    
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