import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSystemPreference, setIsSystemPreference] = useState(true);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (isSystemPreference) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Set initial based on system
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isSystemPreference]);

  const toggleTheme = () => {
    setIsSystemPreference(false);
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setDarkMode = (isDark: boolean) => {
    setIsSystemPreference(false);
    setTheme(isDark ? 'dark' : 'light');
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setDarkMode
  };
};
