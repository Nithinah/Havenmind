import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

export const useSkills = (sessionId) => {
  const [skills, setSkills] = useState([]);
  const [skillStats, setSkillStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Load user skills
  const loadSkills = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get(`/skills/${sessionId}`);
      setSkills(data || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
      setError(err.message);
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Load skill statistics
  const loadSkillStats = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const data = await apiService.get(`/skills/statistics/${sessionId}`);
      setSkillStats(data);
    } catch (err) {
      console.error('Failed to load skill stats:', err);
    }
  }, [sessionId]);

  // Practice a skill
  const practiceSkill = async (practiceData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/skills/practice', practiceData);
      
      // Reload skills and stats after practice
      await Promise.all([loadSkills(), loadSkillStats()]);
      
      return response;
    } catch (err) {
      console.error('Failed to record skill practice:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get skill guidance
  const getSkillGuidance = async (skillName, masteryLevel, userContext = {}) => {
    try {
      const params = new URLSearchParams({
        mastery_level: masteryLevel.toString(),
        ...Object.entries(userContext).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = value.toString();
          }
          return acc;
        }, {})
      });
      
      const response = await apiService.get(`/skills/guidance/${skillName}?${params}`);
      return response;
    } catch (err) {
      console.error('Failed to get skill guidance:', err);
      throw err;
    }
  };

  // Get skill recommendations
  const getSkillRecommendations = async () => {
    if (!sessionId) return [];
    
    try {
      const response = await apiService.get(`/skills/recommendations/${sessionId}`);
      setRecommendations(response.recommendations || []);
      return response.recommendations || [];
    } catch (err) {
      console.error('Failed to get skill recommendations:', err);
      return [];
    }
  };

  // Get available skills
  const getAvailableSkills = async () => {
    try {
      const response = await apiService.get('/skills/available/list');
      return response.skills || [];
    } catch (err) {
      console.error('Failed to get available skills:', err);
      return [];
    }
  };

  // Unlock a skill (for testing)
  const unlockSkill = async (skillName) => {
    if (!sessionId) throw new Error('Session ID required');
    
    try {
      const response = await apiService.post(`/skills/unlock/${sessionId}?skill_name=${skillName}`);
      await loadSkills(); // Refresh skills list
      return response;
    } catch (err) {
      console.error('Failed to unlock skill:', err);
      throw err;
    }
  };

  // Load data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSkills();
      loadSkillStats();
      getSkillRecommendations();
    }
  }, [sessionId, loadSkills, loadSkillStats]);

  // Refresh all data
  const refreshSkills = useCallback(async () => {
    await Promise.all([
      loadSkills(),
      loadSkillStats(),
      getSkillRecommendations()
    ]);
  }, [loadSkills, loadSkillStats]);

  return {
    skills,
    skillStats,
    recommendations,
    isLoading,
    error,
    practiceSkill,
    getSkillGuidance,
    getSkillRecommendations,
    getAvailableSkills,
    unlockSkill,
    refreshSkills,
    setError
  };
};