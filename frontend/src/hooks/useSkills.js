import { useState, useEffect, useCallback } from 'react';
import { skillsService } from '../services/skills.js';

export const useSkills = (userId) => {
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const fetchSkills = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const skillsData = await skillsService.getSkills(userId);
      setSkills(skillsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createSkillGoal = async (skillData) => {
    setLoading(true);
    try {
      const newSkill = await skillsService.createSkillGoal(skillData);
      setSkills(prev => [...prev, newSkill]);
      return newSkill;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (skillId, progress) => {
    try {
      const result = await skillsService.updateSkillProgress(skillId, progress);
      setSkills(prev => 
        prev.map(skill => 
          skill.id === skillId ? { ...skill, ...result } : skill
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const getGuidance = async (skillId, currentLevel) => {
    try {
      const guidance = await skillsService.getSkillGuidance(skillId, currentLevel);
      return guidance;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const trackUsage = async (skillId, duration, effectiveness) => {
    try {
      await skillsService.trackSkillUsage(skillId, duration, effectiveness);
    } catch (err) {
      console.error('Failed to track skill usage:', err);
    }
  };

  const fetchRecommendations = useCallback(async (interests) => {
    if (!userId) return;
    
    try {
      const recs = await skillsService.getRecommendedSkills(userId, interests);
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to fetch skill recommendations:', err);
    }
  }, [userId]);

  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await skillsService.getSkillCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch skill categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
    fetchCategories();
  }, [fetchSkills, fetchCategories]);

  return {
    skills,
    categories,
    recommendations,
    loading,
    error,
    createSkillGoal,
    updateProgress,
    getGuidance,
    trackUsage,
    fetchRecommendations,
    refetch: fetchSkills
  };
};