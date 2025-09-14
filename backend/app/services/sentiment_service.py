from textblob import TextBlob
from typing import Dict, Any, List
import re
import logging

logger = logging.getLogger(__name__)

class SentimentService:
    def __init__(self):
        self.emotion_keywords = {
            "joy": ["happy", "excited", "delighted", "thrilled", "ecstatic", "cheerful", "elated"],
            "love": ["love", "adore", "cherish", "affection", "caring", "devoted", "tender"],
            "gratitude": ["grateful", "thankful", "blessed", "appreciative", "fortunate"],
            "hope": ["hopeful", "optimistic", "confident", "positive", "bright", "promising"],
            "calm": ["peaceful", "serene", "tranquil", "relaxed", "calm", "content", "soothed"],
            "sadness": ["sad", "down", "blue", "melancholy", "gloomy", "dejected", "sorrowful"],
            "anger": ["angry", "furious", "mad", "irritated", "annoyed", "frustrated", "livid"],
            "fear": ["scared", "afraid", "terrified", "anxious", "worried", "nervous", "fearful"],
            "anxiety": ["anxious", "stressed", "overwhelmed", "panicked", "tense", "uneasy"],
            "loneliness": ["lonely", "isolated", "alone", "abandoned", "disconnected", "empty"],
            "confusion": ["confused", "uncertain", "lost", "bewildered", "puzzled", "unclear"],
            "disappointment": ["disappointed", "let down", "discouraged", "deflated", "disheartened"]
        }
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment and emotion from text."""
        try:
            # Clean and prepare text
            cleaned_text = self._clean_text(text)
            
            # Use TextBlob for sentiment analysis
            blob = TextBlob(cleaned_text)
            sentiment_score = blob.sentiment.polarity  # -1 to 1
            subjectivity = blob.sentiment.subjectivity  # 0 to 1
            
            # Detect specific emotions
            detected_emotions = self._detect_emotions(cleaned_text)
            primary_emotion = self._get_primary_emotion(detected_emotions, sentiment_score)
            
            # Calculate intensity
            intensity = self._calculate_intensity(sentiment_score, subjectivity, detected_emotions)
            
            # Extract themes
            themes = self._extract_themes(cleaned_text)
            
            return {
                "sentiment_score": round(sentiment_score, 3),
                "subjectivity": round(subjectivity, 3),
                "primary_emotion": primary_emotion,
                "detected_emotions": detected_emotions,
                "intensity": intensity,
                "themes": themes,
                "word_count": len(cleaned_text.split()),
                "confidence": self._calculate_confidence(sentiment_score, subjectivity, detected_emotions)
            }
        
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return self._fallback_analysis(text)
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for analysis."""
        # Remove extra whitespace and special characters
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        return text.strip().lower()
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect emotions based on keyword matching."""
        emotions = {}
        words = text.split()
        total_words = len(words)
        
        if total_words == 0:
            return emotions
        
        for emotion, keywords in self.emotion_keywords.items():
            count = sum(1 for word in words if any(keyword in word for keyword in keywords))
            if count > 0:
                emotions[emotion] = round(count / total_words, 3)
        
        return emotions
    
    def _get_primary_emotion(self, detected_emotions: Dict[str, float], sentiment_score: float) -> str:
        """Determine primary emotion from detected emotions and sentiment."""
        if detected_emotions:
            # Return emotion with highest score
            return max(detected_emotions, key=detected_emotions.get)
        
        # Fallback to sentiment-based emotion
        if sentiment_score > 0.6:
            return "joy"
        elif sentiment_score > 0.2:
            return "calm"
        elif sentiment_score > -0.2:
            return "neutral"
        elif sentiment_score > -0.6:
            return "sadness"
        else:
            return "anxiety"
    
    def _calculate_intensity(self, sentiment_score: float, subjectivity: float, detected_emotions: Dict[str, float]) -> float:
        """Calculate emotional intensity."""
        base_intensity = abs(sentiment_score)
        subjectivity_boost = subjectivity * 0.3
        emotion_boost = sum(detected_emotions.values()) * 0.2 if detected_emotions else 0
        
        intensity = base_intensity + subjectivity_boost + emotion_boost
        return min(round(intensity, 3), 1.0)
    
    def _extract_themes(self, text: str) -> List[str]:
        """Extract therapeutic themes from text."""
        themes = []
        
        theme_patterns = {
            "growth": r'\b(grow|growth|develop|progress|improve|better|learning|evolve)\b',
            "resilience": r'\b(overcome|strong|survive|endure|bounce back|recover|resilient)\b',
            "gratitude": r'\b(thank|grateful|appreciate|blessed|lucky|fortunate)\b',
            "self_care": r'\b(care|rest|relax|treat myself|self-love|nurture|wellness)\b',
            "relationships": r'\b(friend|family|love|connection|together|support|bond)\b',
            "mindfulness": r'\b(present|aware|mindful|focus|breathe|meditate|conscious)\b',
            "goals": r'\b(achieve|goal|dream|aspire|ambition|future|success)\b',
            "healing": r'\b(heal|recover|mend|restore|peace|wholeness|therapy)\b',
            "creativity": r'\b(create|art|music|write|express|imagine|inspire)\b',
            "spirituality": r'\b(spirit|soul|meaning|purpose|faith|divine|sacred)\b'
        }
        
        for theme, pattern in theme_patterns.items():
            if re.search(pattern, text):
                themes.append(theme)
        
        return themes if themes else ["reflection"]
    
    def _calculate_confidence(self, sentiment_score: float, subjectivity: float, detected_emotions: Dict[str, float]) -> float:
        """Calculate confidence in the analysis."""
        base_confidence = 0.5
        
        # Higher confidence for stronger sentiments
        sentiment_confidence = abs(sentiment_score) * 0.3
        
        # Higher confidence for detected emotions
        emotion_confidence = min(sum(detected_emotions.values()), 0.3) if detected_emotions else 0
        
        # Adjust for subjectivity (very objective or very subjective can be less reliable)
        subjectivity_penalty = abs(subjectivity - 0.5) * 0.1
        
        confidence = base_confidence + sentiment_confidence + emotion_confidence - subjectivity_penalty
        return min(max(round(confidence, 3), 0.1), 1.0)
    
    def _fallback_analysis(self, text: str) -> Dict[str, Any]:
        """Fallback analysis when main analysis fails."""
        word_count = len(text.split())
        
        return {
            "sentiment_score": 0.0,
            "subjectivity": 0.5,
            "primary_emotion": "neutral",
            "detected_emotions": {},
            "intensity": 0.1,
            "themes": ["reflection"],
            "word_count": word_count,
            "confidence": 0.3
        }

# Global service instance
sentiment_service = SentimentService()