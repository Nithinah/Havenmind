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
    
    try {
      const data = await apiService.getSanctuaryElements(sessionId);
      setElements(data || []);
      return data;
    } catch (err) {
      console.error('Failed to load sanctuary elements:', err);
      setError(err.message);
      setElements([]);
      return [];
    }
  }, [sessionId]);

  // Load sanctuary stats
  const loadStats = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const data = await apiService.getSanctuaryStats(sessionId);
      setStats(data);
      return data;
    } catch (err) {
      console.error('Failed to load sanctuary stats:', err);
      return null;
    }
  }, [sessionId]);

  // Create journal entry with immediate UI update
  const createJournalEntry = async (entryData) => {
    if (!sessionId) throw new Error('Session ID required');
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Creating journal entry...', entryData);
      
      const response = await apiService.createJournalEntry({
        ...entryData,
        session_id: sessionId
      });
      
      console.log('✅ Journal entry response:', response);
      
      // IMMEDIATE UI UPDATES - No page refresh needed!
      
      // 1. If response contains new elements, add them immediately
      if (response.new_elements && Array.isArray(response.new_elements)) {
        console.log('🎨 Adding new elements to UI:', response.new_elements);
        setElements(prevElements => [...prevElements, ...response.new_elements]);
      } else if (response.element) {
        // Single element returned
        console.log('🎨 Adding single element to UI:', response.element);
        setElements(prevElements => [...prevElements, response.element]);
      }
      
      // 2. Update companion message immediately
      if (response.companion_response) {
        console.log('💬 Setting companion message:', response.companion_response);
        setCompanionMessage(response.companion_response);
      }
      
      // 3. Update stats immediately if provided
      if (response.updated_stats) {
        console.log('📊 Updating stats:', response.updated_stats);
        setStats(response.updated_stats);
      }
      
      // 4. Refresh data in background (optional fallback)
      // Only do this if we didn't get elements in response
      if (!response.new_elements && !response.element) {
        console.log('🔄 Fallback: Loading elements in background...');
        setTimeout(async () => {
          const newElements = await loadElements();
          const newStats = await loadStats();
          console.log('🔄 Background refresh complete:', { newElements, newStats });
        }, 500);
      }
      
      return response;
    } catch (err) {
      console.error('❌ Failed to create journal entry:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove element with immediate UI update
  const removeElement = async (elementId) => {
    try {
      console.log('🗑️ Removing element:', elementId);
      
      // Optimistic update - remove from UI immediately
      setElements(prevElements => prevElements.filter(el => el.id !== elementId));
      
      // Then call API
      await apiService.deleteElement(elementId);
      
      // Refresh stats after deletion
      await loadStats();
      
      console.log('✅ Element removed successfully');
    } catch (err) {
      console.error('❌ Failed to remove element:', err);
      // Revert optimistic update on error
      await loadElements();
      throw err;
    }
  };

  // Add new element to UI immediately (for real-time updates)
  const addElement = useCallback((newElement) => {
    console.log('➕ Adding element to UI:', newElement);
    setElements(prevElements => {
      // Check if element already exists to avoid duplicates
      const exists = prevElements.some(el => el.id === newElement.id);
      if (exists) return prevElements;
      return [...prevElements, newElement];
    });
  }, []);

  // Update element in UI immediately
  const updateElement = useCallback((updatedElement) => {
    console.log('🔄 Updating element in UI:', updatedElement);
    setElements(prevElements => 
      prevElements.map(el => 
        el.id === updatedElement.id ? { ...el, ...updatedElement } : el
      )
    );
  }, []);

  // Update stats immediately
  const updateStats = useCallback((newStats) => {
    console.log('📊 Updating stats:', newStats);
    setStats(newStats);
  }, []);

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
      console.log('🔄 Loading sanctuary data for session:', sessionId);
      setIsLoading(true);
      Promise.all([loadElements(), loadStats()])
        .then(() => {
          console.log('✅ Initial sanctuary data loaded');
        })
        .catch((err) => {
          console.error('❌ Failed to load initial sanctuary data:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [sessionId, loadElements, loadStats]);

  // Refresh all data (manual refresh)
  const refreshElements = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadElements(), loadStats()]);
      console.log('🔄 Manual refresh completed');
    } catch (err) {
      console.error('❌ Manual refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadElements, loadStats]);

  return {
    elements,
    stats,
    companionMessage,
    isLoading,
    error,
    
    // Actions that update UI immediately
    createJournalEntry,
    removeElement,
    addElement,          // For real-time additions
    updateElement,       // For real-time updates
    updateStats,         // For real-time stats updates
    
    // Utility functions
    getJournalEntries,
    createNewSession,
    refreshElements,     // Manual refresh only
    setCompanionMessage,
    setError
  };
};