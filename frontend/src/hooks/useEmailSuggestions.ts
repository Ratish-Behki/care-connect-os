import { useEffect, useState } from 'react';

const STORAGE_KEY = 'careconnect_email_suggestions';
const MAX_SUGGESTIONS = 5;

export interface EmailSuggestion {
  email: string;
  role: string;
  timestamp: number;
}

export function useEmailSuggestions() {
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load suggestions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSuggestions(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading email suggestions:', error);
    }
    setIsLoaded(true);
  }, []);

  // Add a new email suggestion
  const addSuggestion = (email: string, role: string) => {
    try {
      const newSuggestion: EmailSuggestion = {
        email,
        role,
        timestamp: Date.now(),
      };

      // Remove if already exists
      let updated = suggestions.filter((s) => s.email !== email);

      // Add to beginning
      updated = [newSuggestion, ...updated];

      // Keep only max suggestions
      updated = updated.slice(0, MAX_SUGGESTIONS);

      setSuggestions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding email suggestion:', error);
    }
  };

  // Remove a suggestion
  const removeSuggestion = (email: string) => {
    try {
      const updated = suggestions.filter((s) => s.email !== email);
      setSuggestions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing email suggestion:', error);
    }
  };

  // Clear all suggestions
  const clearAllSuggestions = () => {
    try {
      setSuggestions([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing email suggestions:', error);
    }
  };

  // Get suggestions for a specific role (or all if no role specified)
  const getSuggestions = (role?: string) => {
    if (!role) {
      return suggestions;
    }
    return suggestions.filter((s) => s.role === role);
  };

  return {
    suggestions,
    isLoaded,
    addSuggestion,
    removeSuggestion,
    clearAllSuggestions,
    getSuggestions,
  };
}
