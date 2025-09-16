import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

export const useSanctuary = (sessionId) => {
  const [elements, setElements] = useState([]);
  const [stats, setStats] = useState(null);
  const [companionMessage, setCompanionMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load sanctuary elements
  const loadElements = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get(`/sanctuary/elements/${sessionId}`);
      setElements(data || []);
    } catch (err) {
      console.error('Failed to load sanctuary elements:', err);
      setError(err.message);
      setElements([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Load sanctuary stats
  const loadStats = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const data = await apiService.get(`/sanctuary/stats/${sessionId}`);
      setStats(data);
    } catch (err) {
      console.error('Failed to load sanctuary stats:', err);
    }
  }, [sessionId]);

  // Create journal entry
  const createJournalEntry = async (entryData) => {
    if (!sessionId) throw new Error('Session ID required');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/sanctuary/journal-entry', {
        ...entryData,
        session_id: sessionId
      });
      
      // Reload elements and stats after creating entry
      await Promise.all([loadElements(), loadStats()]);
      
      // Set companion message if available
      if (response.companion_response) {
        setCompanionMessage(response.companion_response);
      }
      
      return response;
    } catch (err) {
      console.error('Failed to create journal entry:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove element
  const removeElement = async (elementId) => {
    try {
      await apiService.delete(`/sanctuary/elements/${elementId}`);
      await loadElements(); // Refresh elements list
    } catch (err) {
      console.error('Failed to remove element:', err);
      throw err;
    }
  };

  // Get journal entries
  const getJournalEntries = async (limit = 50, offset = 0) => {
    if (!sessionId) return [];
    
    try {
      return await apiService.get(`/sanctuary/journal/${sessionId}?limit=${limit}&offset=${offset}`);
    } catch (err) {
      console.error('Failed to get journal entries:', err);
      return [];
    }
  };

  // Create new session
  const createNewSession = async () => {
    try {
      const response = await apiService.get('/sanctuary/session/new');
      return response.session_id;
    } catch (err) {
      console.error('Failed to create new session:', err);
      throw err;
    }
  };

  // Load data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadElements();
      loadStats();
    }
  }, [sessionId, loadElements, loadStats]);

  // Refresh all data
  const refreshElements = useCallback(async () => {
    await Promise.all([loadElements(), loadStats()]);
  }, [loadElements, loadStats]);

  return {
    elements,
    stats,
    companionMessage,
    isLoading,
    error,
    createJournalEntry,
    removeElement,
    getJournalEntries,
    createNewSession,
    refreshElements,
    setCompanionMessage,
    setError
  };
};