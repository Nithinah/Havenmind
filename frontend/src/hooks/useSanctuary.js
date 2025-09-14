import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export const useSanctuary = () => {
  const [sanctuaryState, setSanctuaryState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [lastCompanionMessage, setLastCompanionMessage] = useState(
    "Welcome to your mystical sanctuary. The universe awaits your thoughts..."
  );
  const [constellation, setConstellation] = useState([]);

  // Initialize or get existing session