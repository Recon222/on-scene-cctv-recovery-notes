import { useState, useEffect } from 'react';

export const useInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    const result = await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await result;
    
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
  };

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    handleInstallClick
  };
};

export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = value => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

export const useRecentOCC = () => {
  const [recentOCCs, setRecentOCCs] = useLocalStorage('recentOCCs', []);

  const addRecentOCC = (occ) => {
    setRecentOCCs(prev => {
      const filtered = prev.filter(item => item !== occ);
      return [occ, ...filtered].slice(0, 5);
    });
  };

  return {
    recentOCCs,
    addRecentOCC
  };
};