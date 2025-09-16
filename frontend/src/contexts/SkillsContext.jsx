import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { skillsService } from '../services/skills.js';

const SkillsContext = createContext();

const skillsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SKILLS':
      return { ...state, skills: action.payload, loading: false, error: null };
    case 'ADD_SKILL':
      return { 
        ...state, 
        skills: [...state.skills, action.payload] 
      };
    case 'UPDATE_SKILL':
      return {
        ...state,
        skills: state.skills.map(skill =>
          skill.id === action.payload.id ? action.payload : skill
        )
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    default:
      return state;
  }
};

const initialState = {
  skills: [],
  categories: [],
  recommendations: [],
  loading: false,
  error: null
};

export const SkillsProvider = ({ children, userId }) => {
  const [state, dispatch] = useReducer(skillsReducer, initialState);

  const loadSkills = async () => {
    if (!userId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const skills = await skillsService.getSkills(userId);
      dispatch({ type: 'SET_SKILLS', payload: skills });
      
      const categories = await skillsService.getSkillCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createSkillGoal = async (skillData) => {
    try {
      const newSkill = await skillsService.createSkillGoal(skillData);
      dispatch({ type: 'ADD_SKILL', payload: newSkill });
      return newSkill;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  };

  const updateProgress = async (skillId, progress) => {
    try {
      const updatedSkill = await skillsService.updateSkillProgress(skillId, progress);
      dispatch({ type: 'UPDATE_SKILL', payload: updatedSkill });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadRecommendations = async (interests) => {
    try {
      const recommendations = await skillsService.getRecommendedSkills(userId, interests);
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [userId]);

  const value = {
    ...state,
    createSkillGoal,
    updateProgress,
    loadRecommendations,
    refreshSkills: loadSkills
  };

  return (
    <SkillsContext.Provider value={value}>
      {children}
    </SkillsContext.Provider>
  );
};

export const useSkillsContext = () => {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error('useSkillsContext must be used within a SkillsProvider');
  }
  return context;
};