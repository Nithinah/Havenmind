import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Sparkles, Clock, RefreshCw, 
  Heart, Lightbulb, Compass, Star, 
  Play, Pause, Download, Share2, 
  Plus, Edit3, Save, ChevronRight,
  GripVertical, Type, Palette,
  User, Bot, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
import './StoryWeaver.css';

const StoryWeaver = ({ sessionId }) => {
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStory, setCurrentStory] = useState(null);
  const [storySegments, setStorySegments] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [storyMode, setStoryMode] = useState('select'); // select, building, complete
  const [leftPanelWidth, setLeftPanelWidth] = useState(35); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [currentChoices, setCurrentChoices] = useState([]);
  
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

  // Load recommendation on mount
  useEffect(() => {
    if (sessionId) {
      loadRecommendation();
    }
  }, [sessionId]);

  const loadRecommendation = async () => {
    try {
      // Simulate API call for recommendation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecommendation({
        recommended_style: 'fairy_tale',
        recommended_theme: 'transformation_and_growth',
        reason: 'Based on your recent journal entries showing growth and positive transformation, a fairy tale about personal evolution would be perfect for you right now.'
      });
    } catch (error) {
      console.error('Failed to load recommendation:', error);
    }
  };

  // Handle resizing
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
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
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

  // Generate story opening with choices and background image
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
      setCurrentChoices(opening.choices || []);
      setStoryMode('building');

      // Generate background image using actual opening content
      const imageUrl = await generateBackgroundImage(opening.title, opening.content);
      console.log('🎨 Setting background image to:', imageUrl);
      setBackgroundImage(imageUrl);

      toast.success('Story opening created! Choose your path or add your own twist.');
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
        content: "In a realm where thoughts take shape and emotions paint the sky, a traveler stood at the crossroads of possibility. The path ahead shimmered with potential, each step waiting to be written by the choices of the heart...",
        choices: [
          "The traveler chose the path of courage, where golden light beckoned through ancient trees...",
          "The traveler turned toward the misty path of reflection, where wisdom whispered in the wind..."
        ]
      },
      fairy_tale: {
        title: "The Enchanted Beginning",
        content: "Once upon a time, in a kingdom where magic lived in every heartbeat, there dwelt a soul seeking transformation. The enchanted forest ahead held two doorways, each shimmering with its own unique promise...",
        choices: [
          "Through the crystal door, where fairy lights danced with hope and new beginnings...",
          "Through the oak door, where ancient wisdom and gentle strength waited peacefully..."
        ]
      },
      meditation: {
        title: "The Sacred Pause",
        content: "In the stillness between breaths, in the space between thoughts, a gentle awareness bloomed. Like a lotus opening to the dawn, this moment held infinite possibilities for peace and understanding...",
        choices: [
          "Following the breath deeper into stillness, where clarity awaits...",
          "Embracing the awareness that flows like a gentle river of consciousness..."
        ]
      },
      adventure: {
        title: "The Call to Adventure",
        content: "The morning sun painted the horizon with promise as our hero prepared for the journey ahead. With a heart full of determination and a spirit ready for discovery, two paths stretched into the distance...",
        choices: [
          "Taking the mountain path where challenges build character and strength...",
          "Choosing the river route where flow and adaptability guide the journey..."
        ]
      },
      wisdom: {
        title: "Ancient Teachings",
        content: "The old teacher smiled knowingly, gesturing toward the ancient scroll that held the wisdom of ages. 'Every story,' they said, 'begins with a choice between two truths that will shape the journey ahead...'",
        choices: [
          "The truth of action, where wisdom is found through doing and experience...",
          "The truth of stillness, where wisdom emerges through patience and being..."
        ]
      }
    };

    return {
      id: Date.now(),
      type: 'opening',
      author: 'AI',
      timestamp: new Date().toISOString(),
      ...openings[style]
    };
  };

  // Continue story with AI choice and update background image
  const handleChoiceSelect = async (choice) => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const continuation = {
        id: Date.now(),
        type: 'continuation',
        content: choice,
        author: 'AI',
        timestamp: new Date().toISOString()
      };

      // Generate next choices
      const nextChoices = generateNextChoices();
      setCurrentChoices(nextChoices);
      
      setStorySegments(prev => [...prev, continuation]);

      // Generate background image using the actual selected choice content
      const imageUrl = await generateBackgroundImage(currentStory?.title, choice);
      console.log('🎨 Setting background image to:', imageUrl);
      setBackgroundImage(imageUrl);

      toast.success('Story continued! What happens next?');
    } catch (error) {
      toast.error('Error continuing story');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add user input to story and update background image
  const handleAddUserInput = async () => {
    if (!userInput.trim()) {
      toast.error('Please write something to add to the story');
      return;
    }

    setIsGenerating(true);
    try {
      const userSegment = {
        id: Date.now(),
        type: 'user',
        content: userInput.trim(),
        author: 'You',
        timestamp: new Date().toISOString()
      };

      setStorySegments(prev => [...prev, userSegment]);

      // Generate background image using the actual user input content
      const imageUrl = await generateBackgroundImage(currentStory?.title, userInput.trim());
      console.log('🎨 Setting background image to:', imageUrl);
      setBackgroundImage(imageUrl);

      setUserInput('');

      // Generate AI response to user input
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai_response',
        content: generateAIResponse(userInput.trim()),
        author: 'AI',
        timestamp: new Date().toISOString()
      };

      setStorySegments(prev => [...prev, aiResponse]);
      const nextChoices = generateNextChoices();
      setCurrentChoices(nextChoices);

      toast.success('Your contribution added to the story!');
    } catch (error) {
      toast.error('Error adding your input');
    } finally {
      setIsGenerating(false);
    }
  };
  // Extract character names and context from story for image generation
  const extractStoryContext = (content, choices) => {
    // Extract character names (capitalized words that appear to be names)
    const nameMatch = content.match(/\b[A-Z][a-z]+\b/g);
    const potentialNames = nameMatch ? nameMatch.filter(word => 
      !['The', 'And', 'But', 'For', 'Or', 'A', 'An', 'This', 'That', 'With', 'Through'].includes(word)
    ) : [];
    
    // Extract settings/locations
    const locationKeywords = [
      'forest', 'castle', 'room', 'hall', 'chamber', 'garden', 'mountain', 'valley', 
      'cave', 'clearing', 'path', 'river', 'bridge', 'tower', 'door', 'entrance',
      'kingdom', 'village', 'city', 'palace', 'temple', 'sanctuary', 'meadow'
    ];
    const locations = locationKeywords.filter(loc => 
      content.toLowerCase().includes(loc)
    );
    
    // Extract key actions/verbs
    const actionKeywords = [
      'enter', 'walk', 'discover', 'find', 'see', 'approach', 'climb', 'open',
      'journey', 'travel', 'explore', 'search', 'meet', 'encounter', 'face'
    ];
    const actions = actionKeywords.filter(action => 
      content.toLowerCase().includes(action)
    );
    
    // Extract mood/atmosphere words
    const atmosphereKeywords = [
      'dark', 'bright', 'mysterious', 'peaceful', 'ancient', 'magical', 'enchanted',
      'golden', 'silver', 'misty', 'ethereal', 'serene', 'dramatic', 'mystical'
    ];
    const atmosphere = atmosphereKeywords.filter(mood => 
      content.toLowerCase().includes(mood)
    );
    
    // Build rich context description
    let contextParts = [];
    
    if (potentialNames.length > 0) {
      contextParts.push(`character ${potentialNames[0]}`);
    }
    
    if (actions.length > 0) {
      contextParts.push(`${actions[0]}ing`);
    }
    
    if (locations.length > 0) {
      contextParts.push(`a ${locations[0]}`);
    }
    
    if (atmosphere.length > 0) {
      contextParts.push(`${atmosphere[0]} atmosphere`);
    }
    
    // Add choices context if available
    if (choices && choices.length > 0) {
      const choiceContext = choices.join(' ').toLowerCase();
      const choiceLocations = locationKeywords.filter(loc => choiceContext.includes(loc));
      const choiceActions = actionKeywords.filter(action => choiceContext.includes(action));
      
      if (choiceLocations.length > 0) {
        contextParts.push(`with ${choiceLocations[0]}`);
      }
      if (choiceActions.length > 0) {
        contextParts.push(`${choiceActions[0]} scene`);
      }
    }
    
    // Fallback if no specific context found
    if (contextParts.length === 0) {
      contextParts = ['fantasy story scene', 'magical atmosphere', 'peaceful setting'];
    }
    
    return contextParts.join(', ');
  };

  // Generate background image using backend API
  const generateBackgroundImage = async (title, context) => {
    try {
      console.log('🎨 Generating background image for:', { title, context, selectedStyle, selectedTheme });
      console.log('🔗 API Base URL:', apiService.baseURL);
      
      // Test if backend is reachable
      try {
        await apiService.get('/story/styles');
        console.log('✅ Backend is reachable');
      } catch (testError) {
        console.error('❌ Backend not reachable:', testError);
        throw new Error('Backend not available');
      }
      
      // Call backend story image generation API
      const data = await apiService.post('/story/generate-image', {
        story_content: context,
        story_title: title || '',
        style: selectedStyle || 'fantasy-art',
        theme: selectedTheme || 'adventure'
      });

      console.log('✅ Backend response:', data);

      if (data && data.image_url) {
        console.log('🖼️ Using backend generated image:', data.image_url);
        return data.image_url;
      } else {
        console.log('⚠️ No image URL from backend, using Unsplash fallback');
        // Fallback to Unsplash
        const keywords = encodeURIComponent((title + ' ' + context).replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 100));
        const fallbackUrl = `https://source.unsplash.com/1600x900/?${keywords}`;
        console.log('🔄 Fallback image URL:', fallbackUrl);
        return fallbackUrl;
      }
    } catch (error) {
      console.error('❌ Error generating background image:', error);
      // Don't show toast error for every image generation failure
      // Fallback to Unsplash
      const keywords = encodeURIComponent((title + ' ' + context).replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 100));
      const fallbackUrl = `https://source.unsplash.com/1600x900/?${keywords}`;
      console.log('🔄 Error fallback image URL:', fallbackUrl);
      return fallbackUrl;
    }
  };

  // Generate AI response to user input
  const generateAIResponse = (userInput) => {
    const responses = [
      `Building on your idea, the story took an unexpected turn as ${userInput.toLowerCase()}... The characters found themselves facing new possibilities.`,
      `Your vision sparked something magical. As ${userInput.toLowerCase()}, the narrative began to weave itself into something even more meaningful.`,
      `The story embraced your creative touch. With ${userInput.toLowerCase()}, new pathways of healing and growth opened up.`,
      `Your contribution illuminated the path forward. The tale continued as ${userInput.toLowerCase()}, revealing deeper truths.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Generate next choices
  const generateNextChoices = () => {
    const choiceTemplates = [
      "The character discovered an unexpected ally who offered guidance...",
      "A moment of quiet reflection revealed a hidden strength...",
      "The path led to a beautiful clearing where healing could begin...",
      "An ancient symbol appeared, pointing toward transformation...",
      "The character found a letter that changed everything...",
      "A wise creature appeared with a riddle to solve...",
      "The journey took them to a place of deep peace...",
      "A challenge arose that would test their newfound wisdom..."
    ];
    
    const shuffled = choiceTemplates.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  };

  // Download story with clean format

  const handleDownloadStory = () => {

    if (!currentStory || storySegments.length === 0) {

      toast.error('No story to download');

      return;

    }



    // Create clean story format without AI/User labels

    let cleanStoryText = `${currentStory.title}\n\n`;

    

    storySegments.forEach((segment, index) => {

      // Remove labels and create flowing narrative

      let content = segment.content;

      

      // Clean up any remaining labels

      content = content.replace(/\[AI Generated\]/gi, '');

      content = content.replace(/\[Your Addition\]/gi, '');

      content = content.replace(/Building on your idea,?/gi, '');

      content = content.replace(/then max enters the hall/gi, 'Then Max enters the hall');

      

      // Add proper paragraph breaks

      if (index > 0) {

        cleanStoryText += '\n\n';

      }

      

      cleanStoryText += content.trim();

    });

    

    // Add story metadata

    cleanStoryText += `\n\n\n---\nCreated with HavenMind Story Weaver\nStyle: ${selectedStyle.replace('_', ' ')}\nTheme: ${storyThemes.find(t => t.id === selectedTheme)?.name || selectedTheme}\nCreated: ${new Date().toLocaleDateString()}`;

    

    const blob = new Blob([cleanStoryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStory.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Story downloaded successfully!');
  };

  // Share story
  const handleShareStory = async () => {
    if (!currentStory) {
      toast.error('No story to share');
      return;
    }

    try {
      const shareData = {
        title: `My HavenMind Story: ${currentStory.title}`,
        text: `I've been building a therapeutic story called "${currentStory.title}". Join me in this journey of healing through storytelling with HavenMind.`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Story shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
        toast.success('Story link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Unable to share story');
    }
  };

  // Reset story
  const handleNewStory = () => {
    setStoryMode('select');
    setCurrentStory(null);
    setStorySegments([]);
    setCurrentChoices([]);
    setUserInput('');
    setSelectedStyle('');
    setSelectedTheme('');
    toast.success('Ready to create a new story!');
  };

  return (
    <div className="story-weaver" ref={containerRef} style={{
      backgroundImage: backgroundImage ? `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.05)), url('${backgroundImage}')` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transition: 'background-image 1s ease-in-out',
    }}>
      
      <div className="story-weaver-header">
        <div className="header-content">
          <h2>Interactive Story Weaver</h2>
          <p>Collaborate with AI to build therapeutic stories that evolve with your journey</p>
        </div>
        
        <div className="header-actions">
          {storyMode === 'building' && (
            <>
              <button className="action-btn" onClick={handleShareStory}>
                <Share2 size={16} />
                Share Story
              </button>
              <button className="action-btn" onClick={handleDownloadStory}>
                <Download size={16} />
                Download
              </button>
              <button className="action-btn" onClick={handleNewStory}>
                <Edit3 size={16} />
                New Story
              </button>
            </>
          )}
        </div>
      </div>

      <div className="story-content">
        {/* Left Panel - Controls */}
        <div 
          className="story-controls-panel" 
          style={{ width: `${leftPanelWidth}%` }}
        >
          {storyMode === 'select' && (
            <div className="story-setup">
              {/* Recommendation Card */}
              {recommendation && (
                <motion.div 
                  className="recommendation-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="recommendation-header">
                    <Sparkles size={16} />
                    <span>Recommended for You</span>
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
                      Use This Combination
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Style Selection */}
              <div className="control-section">
                <h3>Choose Your Story Style</h3>
                <div className="style-grid">
                  {storyStyles.map((style, index) => {
                    const Icon = style.icon;
                    return (
                      <motion.div
                        key={style.id}
                        className={`style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                        onClick={() => setSelectedStyle(style.id)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
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
                <h3>Select a Healing Theme</h3>
                <div className="theme-selector">
                  <select 
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="theme-select"
                  >
                    <option value="">Choose a therapeutic theme...</option>
                    {storyThemes.map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  {selectedTheme && (
                    <motion.p 
                      className="selected-theme-description"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {storyThemes.find(t => t.id === selectedTheme)?.description}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                className="generate-button"
                onClick={handleGenerateOpening}
                disabled={isGenerating || !selectedStyle || !selectedTheme}
                whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Weaving your story...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Weave Story</span>
                  </>
                )}
              </motion.button>
            </div>
          )}

          {storyMode === 'building' && (
            <div className="story-building-controls">
              <h3>Continue Your Journey</h3>
              
              {/* User Input */}
              <div className="user-input-section">
                <h4>Add Your Voice</h4>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Add your own narrative, thoughts, or direction to the story. What happens next? How does the character feel? What do they discover?"
                  rows={4}
                  className="user-input"
                  disabled={isGenerating}
                />
                <button 
                  className="add-user-content"
                  onClick={handleAddUserInput}
                  disabled={!userInput.trim() || isGenerating}
                >
                  <Plus size={16} />
                  Add to Story
                </button>
              </div>

              {/* AI Continuation Choices */}
              {currentChoices.length > 0 && (
                <div className="ai-choices-section">
                  <h4>Choose the Path Forward</h4>
                  <div className="choices-list">
                    {currentChoices.map((choice, index) => (
                      <button
                        key={index}
                        className="choice-button"
                        onClick={() => handleChoiceSelect(choice)}
                        disabled={isGenerating}
                      >
                        <ChevronRight size={16} />
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resizer */}
        <div 
          className={`panel-resizer ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          ref={resizeRef}
        >
          <GripVertical size={16} />
        </div>

        {/* Right Panel - Story Display */}
        <div 
          className="story-display-panel" 
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {storyMode === 'select' ? (
            <div className="story-placeholder">
              <div className="placeholder-content">
                <BookOpen size={48} className="placeholder-icon" />
                <h3>Your Interactive Story Journey Awaits</h3>
                <p>Select a style and theme to begin weaving your personalized therapeutic narrative. You'll work together with AI to create a unique story that evolves with your choices and input.</p>
                <div className="feature-list">
                  <div className="feature-item">
                    <Sparkles size={16} />
                    <span>AI generates story openings based on your selections</span>
                  </div>
                  <div className="feature-item">
                    <Edit3 size={16} />
                    <span>Add your own narrative voice and direction</span>
                  </div>
                  <div className="feature-item">
                    <ChevronRight size={16} />
                    <span>Choose between different story paths</span>
                  </div>
                  <div className="feature-item">
                    <Heart size={16} />
                    <span>Build therapeutic stories that reflect your journey</span>
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
                  <span className="segment-count">
                    {storySegments.length} segments
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
                        <div className="segment-author">
                          {segment.author === 'You' ? (
                            <><User size={14} /> </>
                          ) : (
                            <><Bot size={14} /> </>
                          )}
                        </div>
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
                  <motion.div 
                    className="generating-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <RefreshCw size={16} className="spin" />
                    <span>AI is weaving the next part of your story...</span>
                  </motion.div>
                )}

                {storySegments.length > 0 && !isGenerating && (
                  <motion.div 
                    className="story-continues"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="continues-message">
                      <Sparkles size={16} />
                      <span>Your story continues to unfold... What happens next?</span>
                    </div>
                  </motion.div>
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