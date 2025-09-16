import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { sanctuaryService } from '../services/sanctuary.js';

const SanctuaryContext = createContext();

const sanctuaryReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SANCTUARY':
      return { ...state, sanctuary: action.payload, loading: false, error: null };
    case 'UPDATE_MOOD':
      return { 
        ...state, 
        sanctuary: { 
          ...state.sanctuary, 
          currentMood: action.payload 
        } 
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'ADD_COMPANION_MESSAGE':
      return {
        ...state,
        sanctuary: {
          ...state.sanctuary,
          companionMessages: [
            ...(state.sanctuary.companionMessages || []),
            action.payload
          ]
        }
      };
    default:
      return state;
  }
};

const initialState = {
  sanctuary: null,
  loading: false,
  error: null,
  stats: null
};

export const SanctuaryProvider = ({ children, userId }) => {
  const [state, dispatch] = useReducer(sanctuaryReducer, initialState);

  const loadSanctuary = useCallback(async () => {
    if (!userId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const sanctuary = await sanctuaryService.getSanctuary(userId);
      dispatch({ type: 'SET_SANCTUARY', payload: sanctuary });
      
      const stats = await sanctuaryService.getSanctuaryStats(userId);
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [userId]);

  const updateMood = useCallback(async (mood, intensity) => {
    if (!state.sanctuary) return;
    
    try {
      await sanctuaryService.updateMood(state.sanctuary.id, mood, intensity);
      dispatch({ type: 'UPDATE_MOOD', payload: { mood, intensity } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.sanctuary]);

  const getCompanionMessage = useCallback(async (emotion, context) => {
    try {
      const response = await sanctuaryService.getCompanionMessage(emotion, context);
      const message = {
        id: Date.now(),
        content: response.message,
        timestamp: new Date().toISOString(),
        emotion
      };
      dispatch({ type: 'ADD_COMPANION_MESSAGE', payload: message });
      return message;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return null;
    }
  }, []);

  useEffect(() => {
    loadSanctuary();
  }, [loadSanctuary]);

  const value = {
    ...state,
    updateMood,
    getCompanionMessage,
    refreshSanctuary: loadSanctuary
  };

  return (
    <SanctuaryContext.Provider value={value}>
      {children}
    </SanctuaryContext.Provider>
  );
};

export const useSanctuaryContext = () => {
  const context = useContext(SanctuaryContext);
  if (!context) {
    throw new Error('useSanctuaryContext must be used within a SanctuaryProvider');
  }
  return context;
};