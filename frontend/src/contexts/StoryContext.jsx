import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storyService } from '../services/story.js';

const StoryContext = createContext();

const storyReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_STORIES':
      return { ...state, stories: action.payload, loading: false, error: null };
    case 'ADD_STORY':
      return { 
        ...state, 
        stories: [...state.stories, action.payload] 
      };
    case 'UPDATE_STORY':
      return {
        ...state,
        stories: state.stories.map(story =>
          story.id === action.payload.id ? action.payload : story
        )
      };
    case 'SET_CURRENT_STORY':
      return { ...state, currentStory: action.payload };
    case 'ADD_CHAPTER':
      return {
        ...state,
        currentStory: state.currentStory ? {
          ...state.currentStory,
          chapters: [...state.currentStory.chapters, action.payload]
        } : null
      };
    case 'SET_THEMES':
      return { ...state, themes: action.payload };
    default:
      return state;
  }
};

const initialState = {
  stories: [],
  currentStory: null,
  themes: [],
  loading: false,
  error: null
};

export const StoryProvider = ({ children, userId }) => {
  const [state, dispatch] = useReducer(storyReducer, initialState);

  const loadStories = async () => {
    if (!userId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const stories = await storyService.getStories(userId);
      dispatch({ type: 'SET_STORIES', payload: stories });
      
      const themes = await storyService.getStoryThemes();
      dispatch({ type: 'SET_THEMES', payload: themes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createStory = async (storyData) => {
    try {
      const newStory = await storyService.createStory(storyData);
      dispatch({ type: 'ADD_STORY', payload: newStory });
      return newStory;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  const loadStory = async (storyId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const story = await storyService.getStory(storyId);
      dispatch({ type: 'SET_CURRENT_STORY', payload: story });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const generateChapter = async (storyId, prompt, emotion) => {
    try {
      const chapter = await storyService.generateStoryChapter(storyId, prompt, emotion);
      dispatch({ type: 'ADD_CHAPTER', payload: chapter });
      return chapter;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  useEffect(() => {
    loadStories();
  }, [userId]);

  const value = {
    ...state,
    createStory,
    loadStory,
    generateChapter,
    refreshStories: loadStories
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStoryContext = () => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStoryContext must be used within a StoryProvider');
  }
  return context;
};