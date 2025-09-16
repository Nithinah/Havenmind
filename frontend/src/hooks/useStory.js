import { useState, useEffect, useCallback } from 'react';
import { storyService } from '../services/story.js';

export const useStory = (userId) => {
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [themes, setThemes] = useState([]);

  const fetchStories = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const storiesData = await storyService.getStories(userId);
      setStories(storiesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createStory = async (storyData) => {
    setLoading(true);
    try {
      const newStory = await storyService.createStory(storyData);
      setStories(prev => [...prev, newStory]);
      return newStory;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateChapter = async (storyId, prompt, emotion) => {
    try {
      const chapter = await storyService.generateStoryChapter(storyId, prompt, emotion);
      
      if (currentStory?.id === storyId) {
        setCurrentStory(prev => ({
          ...prev,
          chapters: [...prev.chapters, chapter]
        }));
      }
      
      return chapter;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const loadStory = async (storyId) => {
    setLoading(true);
    try {
      const story = await storyService.getStory(storyId);
      setCurrentStory(story);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = useCallback(async () => {
    try {
      const themesData = await storyService.getStoryThemes();
      setThemes(themesData);
    } catch (err) {
      console.error('Failed to fetch story themes:', err);
    }
  }, []);

  useEffect(() => {
    fetchStories();
    fetchThemes();
  }, [fetchStories, fetchThemes]);

  return {
    stories,
    currentStory,
    loading,
    error,
    themes,
    createStory,
    generateChapter,
    loadStory,
    refetch: fetchStories
  };
};