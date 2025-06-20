import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Safe localStorage access helper
const getFromLocalStorage = (key, defaultValue) => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return defaultValue;
  }
};

// Safe localStorage write helper
const saveToLocalStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const ThemeProvider = ({ children }) => {
  // Initialize state with a function that runs on client-side only
  const [initialized, setInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // First useEffect: Initialize theme (runs only once)
  useEffect(() => {
    // Get user preference from localStorage or system preference
    const savedTheme = getFromLocalStorage('darkMode', null);
    const prefersDark = typeof window !== 'undefined' && 
                         window.matchMedia && 
                         window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme based on saved preference or system default
    setDarkMode(savedTheme !== null ? savedTheme : prefersDark);
    setInitialized(true);
  }, []);

  // Second useEffect: Apply theme changes and persist to localStorage
  useEffect(() => {
    if (!initialized) return;
    
    // Apply dark mode class to document
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Save preference to localStorage
    saveToLocalStorage('darkMode', darkMode);
  }, [darkMode, initialized]);

  // Toggle function for theme
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, initialized }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
