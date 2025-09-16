import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Sparkles, Clock, RefreshCw, 
  Heart, Lightbulb, Compass, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';

import StoryDisplay from './StoryDisplay';
import { useStory } from '../../hooks/useStory';
import './StoryWeaver.css';

const StoryWeaver = ({ sessionId }) => {
  const [selectedStyle, setSelectedStyle] = useState('allegory');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [storyHistory, setStoryHistory] = useState([]);
  const [recommendation, setRecommendation] = useState(null);

  const { generateStory, getStoryHistory, getRecommendation } = useStory(sessionId);

  // Story styles with descriptions
  const storyStyles = [
    {
      id: 'allegory',
      name: 'Allegory',
      icon: Compass,
      description: 'Symbolic stories that mirror your emotional journey with deeper meaning',
      example: 'A traveler finding their way through an enchanted forest...',
      color: '#8b5cf6'
    },
    {
      id: 'fairy_tale',
      name: 'Fairy Tale',
      icon: Star,
      description: 'Magical stories with wonder, transformation, and hope',
      example: 'Once upon a time, in a realm where emotions had wings...',
      color: '#ec4899'
    },
    {
      id: 'meditation',
      name: 'Meditation',
      icon: Heart,
      description: 'Contemplative journeys that guide peaceful reflection',
      example: 'Breathe deeply and imagine walking along a tranquil path...',
      color: '#10b981'
    },
    {
      id: 'adventure',
      name: 'Adventure',
      icon: Lightbulb,
      description: 'Uplifting tales of courage, discovery, and personal growth',
      example: 'The brave soul set out to discover hidden strengths...',
      color: '#f59e0b'
    },
    {
      id: 'wisdom',
      name: 'Wisdom Story',
      icon: BookOpen,
      description: 'Ancient teachings and gentle guidance for life\'s challenges',
      example: 'An old sage once shared this truth with those who sought wisdom...',
      color: '#3b82f6'
    }
  ];

  // Available themes
  const storyThemes = [
    { id: 'overcoming_challenges', name: 'Overcoming Challenges', description: 'Stories of resilience and strength' },
    { id: 'transformation_and_growth', name: 'Transformation & Growth', description: 'Tales of personal evolution' },
    { id: 'finding_inner_light', name: 'Finding Inner Light', description: 'Discovering joy and hope within' },
    { id: 'connection_and_belonging', name: 'Connection & Belonging', description: 'Stories about relationships and community' },
    { id: 'finding_peace_in_uncertainty', name: 'Peace in Uncertainty', description: 'Finding calm amid life\'s unknowns' },
    { id: 'the_healing_journey', name: 'The Healing Journey', description: 'Tales of recovery and wholeness' },
    { id: 'present_moment_awareness', name: 'Present Moment Awareness', description: 'Mindfulness and being here now' },
    { id: 'discovering_inner_wisdom', name: 'Discovering Inner Wisdom', description: 'Trusting your inner knowledge' }
  ];

  useEffect(() => {
    if (sessionId) {
      loadStoryHistory();
      loadRecommendation();
    }
  }, [sessionId, loadStoryHistory, loadRecommendation]); // Added missing dependencies

  // You'll need to wrap these functions with useCallback:
  const loadStoryHistory = useCallback(async () => {
    try {
      const history = await getStoryHistory();
      setStoryHistory(history || []);
    } catch (error) {
      console.error('Error loading story history:', error);
    }
  }, [getStoryHistory]);

  const loadRecommendation = useCallback(async () => {
    try {
      const rec = await getRecommendation();
      setRecommendation(rec);
    } catch (error) {
      console.error('Error loading recommendation:', error);
    }
  }, [getRecommendation]);

  const handleGenerateStory = async () => {
    if (!selectedStyle) {
      toast.error('Please select a story style');
      return;
    }

    setIsGenerating(true);
    try {
      const storyData = await generateStory({
        session_id: sessionId,
        style: selectedStyle,
        theme: selectedTheme || undefined
      });

      setCurrentStory(storyData);
      setStoryHistory(prev => [storyData, ...prev]);
      toast.success('Your personalized story has been woven');
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Unable to generate story right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseRecommendation = () => {
    if (recommendation) {
      setSelectedStyle(recommendation.recommended_style);
      setSelectedTheme(recommendation.recommended_theme);
      toast.success('Applied recommended settings');
    }
  };

  const handleStorySelect = (story) => {
    setCurrentStory(story);
  };

  return (
    <div className="story-weaver">
      <div className="story-weaver-header">
        <div className="header-content">
          <h2>Story Weaver</h2>
          <p>AI-crafted therapeutic stories tailored to your emotional journey</p>
        </div>
        <div className="header-stats">
          <span className="story-count">{storyHistory.length} stories created</span>
        </div>
      </div>

      <div className="story-weaver-content">
        <div className="story-controls">
          {/* Recommendation Card */}
          {recommendation && (
            <motion.div 
              className="recommendation-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="recommendation-header">
                <Sparkles size={16} />
                <span>Recommended for you</span>
              </div>
              <div className="recommendation-content">
                <div className="recommendation-suggestion">
                  <strong>{storyStyles.find(s => s.id === recommendation.recommended_style)?.name}</strong>
                  <span> • </span>
                  <span>{storyThemes.find(t => t.id === recommendation.recommended_theme)?.name}</span>
                </div>
                <p className="recommendation-reason">{recommendation.reason}</p>
                <button 
                  className="use-recommendation"
                  onClick={handleUseRecommendation}
                >
                  Use This Suggestion
                </button>
              </div>
            </motion.div>
          )}

          {/* Style Selection */}
          <div className="control-section">
            <h3>Choose Your Story Style</h3>
            <div className="style-grid">
              {storyStyles.map(style => {
                const Icon = style.icon;
                return (
                  <motion.div
                    key={style.id}
                    className={`style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                    onClick={() => setSelectedStyle(style.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="style-icon" style={{ color: style.color }}>
                      <Icon size={24} />
                    </div>
                    <div className="style-content">
                      <h4>{style.name}</h4>
                      <p>{style.description}</p>
                      <div className="style-example">"{style.example}"</div>
                    </div>
                    {selectedStyle === style.id && (
                      <div className="selection-indicator" style={{ backgroundColor: style.color }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="control-section">
            <h3>Select a Theme (Optional)</h3>
            <p className="theme-subtitle">Leave blank for AI to choose based on your sanctuary context</p>
            <div className="theme-selector">
              <select 
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="theme-select"
              >
                <option value="">Let AI choose for me</option>
                {storyThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              {selectedTheme && (
                <p className="selected-theme-description">
                  {storyThemes.find(t => t.id === selectedTheme)?.description}
                </p>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            className="generate-button"
            onClick={handleGenerateStory}
            disabled={isGenerating || !selectedStyle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Weaving your story...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Weave My Story</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Story Display */}
        <div className="story-display-container">
          <AnimatePresence mode="wait">
            {currentStory ? (
              <StoryDisplay 
                key={currentStory.id}
                story={currentStory}
                onClose={() => setCurrentStory(null)}
              />
            ) : (
              <motion.div
                key="empty"
                className="story-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="placeholder-content">
                  <BookOpen size={48} className="placeholder-icon" />
                  <h3>Your story awaits</h3>
                  <p>Select a style and theme, then let AI weave a personalized therapeutic story just for you.</p>
                  {storyHistory.length > 0 && (
                    <div className="recent-stories">
                      <h4>Recent Stories</h4>
                      <div className="story-list">
                        {storyHistory.slice(0, 3).map(story => (
                          <button
                            key={story.id}
                            className="story-item"
                            onClick={() => handleStorySelect(story)}
                          >
                            <div className="story-item-content">
                              <strong>{story.title}</strong>
                              <div className="story-item-meta">
                                <span className="story-style">{story.style.replace('_', ' ')}</span>
                                <span className="story-time">
                                  <Clock size={12} />
                                  {story.reading_time}min
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StoryWeaver;