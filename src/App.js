import React, {useState, useEffect} from 'react';
import LandingPage from './components/LandingPage';
import SplitModelers from './components/SplitModelers';
import './App.css';

// Constants for localStorage
const VIEW_STATE_STORAGE_KEY = 'app-view-state';
const LOADED_FILE_STORAGE_KEY = 'app-loaded-file';

function App() {
  // Initialize state from localStorage or default to landing page
  const [currentView, setCurrentView] = useState(() => {
    const savedViewState = localStorage.getItem(VIEW_STATE_STORAGE_KEY);
    return savedViewState || 'landing';
  });
  
  const [loadedFile, setLoadedFile] = useState(() => {
    const savedFile = localStorage.getItem(LOADED_FILE_STORAGE_KEY);
    return savedFile ? JSON.parse(savedFile) : null;
  });

  // Persist view state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VIEW_STATE_STORAGE_KEY, currentView);
  }, [currentView]);

  // Persist loaded file to localStorage whenever it changes
  useEffect(() => {
    if (loadedFile) {
      localStorage.setItem(LOADED_FILE_STORAGE_KEY, JSON.stringify(loadedFile));
    } else {
      localStorage.removeItem(LOADED_FILE_STORAGE_KEY);
    }
  }, [loadedFile]);

  // Handle body overflow based on current view
  useEffect(() => {
    const body = document.body;
    const root = document.getElementById('root');
    
    if (currentView === 'landing') {
      body.style.overflow = 'auto';
      body.style.height = 'auto';
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    } else {
      body.style.overflow = 'hidden';
      body.style.height = '100vh';
      root.style.overflow = 'hidden';
      root.style.height = '100vh';
    }
    
    return () => {
      // Cleanup on unmount
      body.style.overflow = '';
      body.style.height = '';
      root.style.overflow = '';
      root.style.height = '';
    };
  }, [currentView]);

  const handleStartModeling = () => {
    setLoadedFile(null); // Clear any previously loaded file
    setCurrentView('modelers');
  };

  const handleLoadFile = (content, fileType, fileName) => {
    setLoadedFile({ content, fileType, fileName });
    setCurrentView('modelers');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setLoadedFile(null); // Clear loaded file when going back to landing
  };

  if (currentView === 'landing') {
    return (
      <LandingPage 
        onStartModeling={handleStartModeling}
        onLoadFile={handleLoadFile}
      />
    );
  }

  return (
    <SplitModelers 
      loadedFile={loadedFile}
      onBackToLanding={handleBackToLanding}
    />
  );
}

export default App;
