import React, {useState, useEffect} from 'react';
import LandingPage from './components/LandingPage';
import SplitModelers from './components/SplitModelers';
import './App.css';

const VIEW_STATE_STORAGE_KEY = 'app-view-state';
const LOADED_FILE_STORAGE_KEY = 'app-loaded-file';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const savedViewState = localStorage.getItem(VIEW_STATE_STORAGE_KEY);
    return savedViewState || 'landing';
  });
  
  const [loadedFile, setLoadedFile] = useState(() => {
    const savedFile = localStorage.getItem(LOADED_FILE_STORAGE_KEY);
    return savedFile ? JSON.parse(savedFile) : null;
  });

  useEffect(() => {
    localStorage.setItem(VIEW_STATE_STORAGE_KEY, currentView);
  }, [currentView]);

  useEffect(() => {
    if (loadedFile) {
      localStorage.setItem(LOADED_FILE_STORAGE_KEY, JSON.stringify(loadedFile));
    } else {
      localStorage.removeItem(LOADED_FILE_STORAGE_KEY);
    }
  }, [loadedFile]);

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
      body.style.overflow = '';
      body.style.height = '';
      root.style.overflow = '';
      root.style.height = '';
    };
  }, [currentView]);

  const handleStartModeling = () => {
    setLoadedFile(null);
    setCurrentView('modelers');
  };

  const handleLoadFile = (content, fileType, fileName) => {
    setLoadedFile({ content, fileType, fileName });
    setCurrentView('modelers');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setLoadedFile(null);
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
