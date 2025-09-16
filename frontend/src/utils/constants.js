// utils/constants.js
export const API_ENDPOINTS = {
  SANCTUARY: '/sanctuary',
  STORIES: '/stories',
  SKILLS: '/skills',
  AUTH: '/auth'
};

export const EMOTIONS = {
  CALM: 'calm',
  ANXIOUS: 'anxious',
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  EXCITED: 'excited',
  OVERWHELMED: 'overwhelmed',
  PEACEFUL: 'peaceful',
  FRUSTRATED: 'frustrated',
  HOPEFUL: 'hopeful'
};

export const MOOD_COLORS = {
  [EMOTIONS.CALM]: '#87CEEB',
  [EMOTIONS.ANXIOUS]: '#FFB6C1',
  [EMOTIONS.HAPPY]: '#FFD700',
  [EMOTIONS.SAD]: '#4682B4',
  [EMOTIONS.ANGRY]: '#DC143C',
  [EMOTIONS.EXCITED]: '#FF6347',
  [EMOTIONS.OVERWHELMED]: '#800080',
  [EMOTIONS.PEACEFUL]: '#98FB98',
  [EMOTIONS.FRUSTRATED]: '#FF4500',
  [EMOTIONS.HOPEFUL]: '#32CD32'
};

export const SANCTUARY_THEMES = {
  FOREST: 'forest',
  BEACH: 'beach',
  MOUNTAIN: 'mountain',
  GARDEN: 'garden',
  SPACE: 'space',
  COZY_ROOM: 'cozy_room',
  LIBRARY: 'library',
  MEADOW: 'meadow'
};

export const SKILL_CATEGORIES = {
  MINDFULNESS: 'mindfulness',
  COMMUNICATION: 'communication',
  EMOTIONAL_REGULATION: 'emotional_regulation',
  STRESS_MANAGEMENT: 'stress_management',
  CREATIVITY: 'creativity',
  SELF_CARE: 'self_care',
  RELATIONSHIPS: 'relationships',
  PRODUCTIVITY: 'productivity',
  RESILIENCE: 'resilience',
  PERSONAL_GROWTH: 'personal_growth'
};

export const STORY_GENRES = {
  ADVENTURE: 'adventure',
  MYSTERY: 'mystery',
  FANTASY: 'fantasy',
  SCI_FI: 'sci_fi',
  ROMANCE: 'romance',
  THRILLER: 'thriller',
  DRAMA: 'drama',
  COMEDY: 'comedy',
  HEALING: 'healing',
  INSPIRATIONAL: 'inspirational'
};

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800
};

export const LOCAL_STORAGE_KEYS = {
  USER_PREFERENCES: 'havenmind_user_preferences',
  SANCTUARY_STATE: 'havenmind_sanctuary_state',
  STORY_PROGRESS: 'havenmind_story_progress',
  SKILL_PROGRESS: 'havenmind_skill_progress',
  THEME_SETTINGS: 'havenmind_theme_settings'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'You need to log in to access this feature.',
  FORBIDDEN: 'You don\'t have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.'
};

export const SUCCESS_MESSAGES = {
  SANCTUARY_UPDATED: 'Your sanctuary has been updated successfully!',
  STORY_CREATED: 'Your new story has been created!',
  SKILL_PROGRESS_UPDATED: 'Great job! Your skill progress has been updated.',
  MOOD_LOGGED: 'Your mood has been logged. Take care of yourself!',
  CHAPTER_GENERATED: 'A new chapter has been added to your story!'
};