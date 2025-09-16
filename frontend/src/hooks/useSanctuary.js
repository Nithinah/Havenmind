import { useState, useEffect, useCallback } from 'react';
import { sanctuaryService } from '../services/sanctuary.js';

export const useSanctuary = (userId) => {
  const [sanctuary, setSanctuary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchSanctuary = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sanctuaryData = await sanctuaryService.getSanctuary(userId);
      setSanctuary(sanctuaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateMood = async (mood, intensity) => {
    if (!sanctuary) return;
    
    setLoading(true);
    try {
      const result = await sanctuaryService.updateMood(sanctuary.id, mood, intensity);
      setSanctuary(prev => ({ ...prev, ...result }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompanionMessage = async (emotion, context) => {
    try {
      const response = await sanctuaryService.getCompanionMessage(emotion, context);
      return response.message;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const statsData = await sanctuaryService.getSanctuaryStats(userId);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch sanctuary stats:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchSanctuary();
    fetchStats();
  }, [fetchSanctuary, fetchStats]);

  return {
    sanctuary,
    loading,
    error,
    stats,
    updateMood,
    getCompanionMessage,
    refetch: fetchSanctuary
  };
};