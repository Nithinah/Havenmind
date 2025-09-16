import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

export const useStory = (sessionId) => {
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  // Generate a new story
  const generateStory = async (storyRequest) => {
    if (!sessionId) throw new Error('Session ID required');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/story/generate', {
        ...storyRequest,
        session_id: sessionId
      });
      
      setCurrentStory(response);
      
      // Add to stories list
      setStories(prev => [response, ...prev]);
      
      return response;
    } catch (err) {
      console.error('Failed to generate story:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get story history
  const getStoryHistory = async (limit = 20, offset = 0) => {
    if (!sessionId) return [];
    
    try {
      const response = await apiService.get(`/story/history/${sessionId}?limit=${limit}&offset=${offset}`);
      setStories(response || []);
      return response || [];
    } catch (err) {
      console.error('Failed to get story history:', err);
      setStories([]);
      return [];
    }
  };

  // Get story styles
  const getStoryStyles = async () => {
    try {
      const response = await apiService.get('/story/styles');
      return response.styles || [];
    } catch (err) {
      console.error('Failed to get story styles:', err);
      return [];
    }
  };

  // Get story themes
  const getStoryThemes = async () => {
    try {
      const response = await apiService.get('/story/themes');
      return response.themes || [];
    } catch (err) {
      console.error('Failed to get story themes:', err);
      return [];
    }
  };

  // Get story recommendation
  const getRecommendation = async () => {
    if (!sessionId) return null;
    
    try {
      const response = await apiService.get(`/story/recommend/${sessionId}`);
      setRecommendation(response);
      return response;
    } catch (err) {
      console.error('Failed to get story recommendation:', err);
      return null;
    }
  };

  // Delete a story
  const deleteStory = async (storyId) => {
    try {
      await apiService.delete(`/story/${storyId}`);
      
      // Remove from local state
      setStories(prev => prev.filter(story => story.id !== storyId));
      
      // Clear current story if it was deleted
      if (currentStory?.id === storyId) {
        setCurrentStory(null);
      }
      
    } catch (err) {
      console.error('Failed to delete story:', err);
      throw err;
    }
  };

  // Load story history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      getStoryHistory();
      getRecommendation();
    }
  }, [sessionId]);

  return {
    stories,
    currentStory,
    recommendation,
    isLoading,
    error,
    generateStory,
    getStoryHistory,
    getStoryStyles,
    getStoryThemes,
    getRecommendation,
    deleteStory,
    setCurrentStory,
    setError
  };
};