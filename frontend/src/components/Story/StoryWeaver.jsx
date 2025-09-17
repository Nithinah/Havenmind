import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Sparkles, Clock, RefreshCw, 
  Heart, Lightbulb, Compass, Star, 
  Play, Pause, Download, Share2, 
  Plus, Edit3, Save, ChevronRight,
  GripVertical, Type, Palette
} from 'lucide-react';
import toast from 'react-hot-toast';
import './StoryWeaver.css';

const StoryWeaver = ({ sessionId }) => {
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [storySegments, setStorySegments] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [storyMode, setStoryMode] = useState('select'); // select, building, complete
  const [leftPanelWidth, setLeftPanelWidth] = useState(35); // Percentage
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  
  const resizeRef = useRef(null);
  const containerRef = useRef(null);

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

  // Handle resizing
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    const containerWidth = containerRef.current?.offsetWidth || 1000;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 25), 60);
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

  // Generate story opening
  const handleGenerateOpening = async () => {
    if (!selectedStyle || !selectedTheme) {
      toast.error('Please select both a style and theme');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call for story opening
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const opening = generateStoryOpening(selectedStyle, selectedTheme);
      const storyData = {
        id: Date.now(),
        title: opening.title,
        style: selectedStyle,
        theme: selectedTheme,
        created_at: new Date().toISOString()
      };
      
      setCurrentStory(storyData);
      setStorySegments([opening]);
      setStoryMode('building');
      toast.success('Story opening created! Now build your narrative.');
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Unable to generate story opening. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate story opening based on style and theme
  const generateStoryOpening = (style, theme) => {
    const openings = {
      allegory: {
        title: "The Journey Within",
        content: "In a realm where thoughts take shape and emotions paint the sky, a traveler stood at the crossroads of possibility. The path ahead shimmered with potential, each step waiting to be written...",
        choices: [
          "The traveler chose the path of courage, where golden light beckoned...",
          "The traveler turned toward the misty path of reflection, where wisdom whispered..."
        ]
      },
      fairy_tale: {
        title: "The Enchanted Beginning",
        content: "Once upon a time, in a kingdom where magic lived in every heartbeat, there dwelt a soul seeking transformation. The enchanted forest ahead held two doorways, each promising a different adventure...",
        choices: [
          "Through the crystal door, where fairy lights danced with hope...",
          "Through the oak door, where ancient wisdom slumbered peacefully..."
        ]
      },
      meditation: {
        title: "The Sacred Pause",
        content: "In the stillness between breaths, in the space between thoughts, a gentle awareness bloomed. Like a lotus opening to the dawn, the moment held infinite possibilities...",
        choices: [
          "Following the breath into deeper stillness...",
          "Embracing the awareness that flows like a gentle river..."
        ]
      },
      adventure: {
        title: "The Call to Adventure",
        content: "The morning sun painted the horizon with promise as our hero prepared for the journey ahead. With a heart full of determination and a spirit ready for discovery, the adventure was about to begin...",
        choices: [
          "Setting forth on the mountain path where challenges await...",
          "Choosing the river route where flow and adaptability guide the way..."
        ]
      },
      wisdom: {
        title: "Ancient Teachings",
        content: "The old teacher smiled knowingly, gesturing toward the ancient scroll that held the wisdom of ages. 'Every story,' they said, 'begins with a choice between two truths...'",
        choices: [
          "The truth of action, where wisdom is found through doing...",
          "The truth of stillness, where wisdom emerges through being..."
        ]
      }
    };

    return {
      id: Date.now(),
      type: 'opening',
      ...openings[style],
      author: 'AI',
      timestamp: new Date().toISOString()
    };
  };

  // Continue story with AI or user input
  const handleContinueStory = async (choice = null, userText = null) => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let newSegment;
      if (userText) {
        newSegment = {
          id: Date.now(),
          type: 'user',
          content: userText,
          author: 'You',
          timestamp: new Date().toISOString()
        };
      } else if (choice) {
        newSegment = {
          id: Date.now(),
          type: 'continuation',
          content: choice,
          author: 'AI',
          timestamp: new Date().toISOString(),
          choices: generateNextChoices()
        };
      }
      
      setStorySegments(prev => [...prev, newSegment]);
      setUserInput('');
      toast.success('Story continued!');
    } catch (error) {
      toast.error('Error continuing story');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate next choices
  const generateNextChoices = () => {
    const choices = [
      "The path led to an unexpected discovery...",
      "A wise companion appeared with guidance...",
      "The character faced an internal challenge...",
      "A moment of clarity changed everything..."
    ];
    return choices.slice(0, 2);
  };

  // Download story
  const handleDownloadStory = () => {
    if (!currentStory || storySegments.length === 0) {
      toast.error('No story to download');
      return;
    }

    const storyText = `${currentStory.title}\n\n${storySegments.map(segment => 
      `${segment.author === 'You' ? '[Your Addition]' : ''}\n${segment.content}\n`
    ).join('\n')}\n\n---\nCreated with HavenMind\nStyle: ${selectedStyle}\nTheme: ${selectedTheme}`;
    
    const blob = new Blob([storyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStory.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Story downloaded!');
  };

  // Share story
  const handleShareStory = async () => {
    try {
      const shareData = {
        title: currentStory?.title || 'My HavenMind Story',
        text: `I've been building a therapeutic story: "${currentStory?.title}". Join me in this journey of healing through storytelling.`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Story shared!');
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast.success('Story details copied to clipboard!');
      }
    } catch (error) {
      toast.error('Unable to share story');
    }
  };

  // Auto-play story
  const handleAutoPlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && storySegments.length > 0) {
      // Start auto-play logic here
      toast.info('Auto-play started');
    }
  };

  return (
    <div className="story-weaver" ref={containerRef}>
      <div className="story-weaver-header">
        <div className="header-content">
          <h2>Interactive Story Builder</h2>
          <p>Collaborate with AI to build therapeutic stories that evolve with your journey</p>
        </div>
        
        <div className="header-actions">
          {storyMode === 'building' && (
            <>
              <button className="action-btn" onClick={handleAutoPlay}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Auto-play'}
              </button>
              <button className="action-btn" onClick={handleShareStory}>
                <Share2 size={16} />
                Share
              </button>
              <button className="action-btn" onClick={handleDownloadStory}>
                <Download size={16} />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      <div className="story-content" style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Left Panel - Controls */}
        <div 
          className="story-controls-panel" 
          style={{ width: `${leftPanelWidth}%`, minWidth: '300px' }}
        >
          {storyMode === 'select' && (
            <div className="story-setup">
              {/* Recommendation Card */}
              {recommendation && (
                <motion.div className="recommendation-card">
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
                      onClick={() => {
                        setSelectedStyle(recommendation.recommended_style);
                        setSelectedTheme(recommendation.recommended_theme);
                        toast.success('Applied recommended settings');
                      }}
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
                <h3>Select a Theme</h3>
                <div className="theme-selector">
                  <select 
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="theme-select"
                  >
                    <option value="">Choose a theme...</option>
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
                onClick={handleGenerateOpening}
                disabled={isGenerating || !selectedStyle || !selectedTheme}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Creating opening...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Begin Story</span>
                  </>
                )}
              </motion.button>
            </div>
          )}

          {storyMode === 'building' && (
            <div className="story-building-controls">
              <h3>Continue Your Story</h3>
              
              {/* User Input */}
              <div className="user-input-section">
                <h4>Add Your Voice</h4>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Add your own narrative, thoughts, or direction to the story..."
                  rows={4}
                  className="user-input"
                />
                <button 
                  className="add-user-content"
                  onClick={() => handleContinueStory(null, userInput)}
                  disabled={!userInput.trim() || isGenerating}
                >
                  <Plus size={16} />
                  Add to Story
                </button>
              </div>

              {/* AI Continuation Choices */}
              {storySegments.length > 0 && storySegments[storySegments.length - 1].choices && (
                <div className="ai-choices-section">
                  <h4>AI Suggestions</h4>
                  <div className="choices-list">
                    {storySegments[storySegments.length - 1].choices.map((choice, index) => (
                      <button
                        key={index}
                        className="choice-button"
                        onClick={() => handleContinueStory(choice)}
                        disabled={isGenerating}
                      >
                        <ChevronRight size={16} />
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Actions */}
              <div className="story-actions">
                <button 
                  className="action-button secondary"
                  onClick={() => {
                    setStoryMode('select');
                    setCurrentStory(null);
                    setStorySegments([]);
                  }}
                >
                  <Edit3 size={16} />
                  New Story
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resizer */}
        <div 
          className="panel-resizer"
          onMouseDown={handleMouseDown}
          ref={resizeRef}
        >
          <GripVertical size={16} />
        </div>

        {/* Right Panel - Story Display */}
        <div 
          className="story-display-panel" 
          style={{ width: `${100 - leftPanelWidth}%`, minWidth: '400px' }}
        >
          {storyMode === 'select' ? (
            <div className="story-placeholder">
              <div className="placeholder-content">
                <BookOpen size={48} className="placeholder-icon" />
                <h3>Your Interactive Story Awaits</h3>
                <p>Select a style and theme to begin building your personalized therapeutic narrative. You'll collaborate with AI to create a unique story that evolves with your input.</p>
                <div className="feature-list">
                  <div className="feature-item">
                    <Sparkles size={16} />
                    <span>AI generates story openings</span>
                  </div>
                  <div className="feature-item">
                    <Edit3 size={16} />
                    <span>Add your own narrative</span>
                  </div>
                  <div className="feature-item">
                    <ChevronRight size={16} />
                    <span>Choose story directions</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="interactive-story-display">
              <div className="story-header">
                <h2>{currentStory?.title}</h2>
                <div className="story-meta">
                  <span className="style-badge" style={{ 
                    backgroundColor: storyStyles.find(s => s.id === selectedStyle)?.color 
                  }}>
                    {selectedStyle?.replace('_', ' ')}
                  </span>
                  <span className="theme-badge">
                    {storyThemes.find(t => t.id === selectedTheme)?.name}
                  </span>
                </div>
              </div>

              <div className="story-content-area">
                <AnimatePresence>
                  {storySegments.map((segment, index) => (
                    <motion.div
                      key={segment.id}
                      className={`story-segment ${segment.author === 'You' ? 'user-segment' : 'ai-segment'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="segment-header">
                        <span className="segment-author">{segment.author}</span>
                        <span className="segment-time">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="segment-content">
                        {segment.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isGenerating && (
                  <div className="generating-indicator">
                    <RefreshCw size={16} className="spin" />
                    <span>AI is continuing the story...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryWeaver;