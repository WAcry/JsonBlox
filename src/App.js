import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import JsonEditor from './components/JsonEditor';
import JsonBlocks from './components/JsonBlocks';
import SharedJsonView from './components/SharedJsonView';
import Header from './components/Header';
import { defaultJson } from './utils/constants';
import './App.css';
import { SpeedInsights } from '@vercel/speed-insights/react';

const theme = createTheme({
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

const levelColors = [
  '#2196f3', // Level 1 - Blue
  '#4caf50', // Level 2 - Green
  '#ff9800', // Level 3 - Orange
  '#9c27b0', // Level 4 - Purple
  '#f44336', // Level 5 - Red
  '#009688', // Level 6 - Teal
];

function App() {
  const [isBlockView, setIsBlockView] = useState(true);
  const [jsonData, setJsonData] = useState(defaultJson);
  const [freezeJsonData, setFreezeJsonData] = useState(defaultJson);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isSharedView = urlParams.has('share');
    setIsShared(isSharedView);

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Data will be lost if you leave the page.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleJsonChange = (newJson) => {
    setJsonData(newJson);
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    setJsonData(defaultJson);
    setFreezeJsonData(defaultJson);
    setHasUnsavedChanges(false);
  };

  const handleSharedJsonLoad = (sharedData) => {
    setJsonData(sharedData);
    setHasUnsavedChanges(false);
  };

  const handleFreezeJsonLoad = (freezeData) => {
    setFreezeJsonData(freezeData);
  };

  const handleViewToggle = () => {
    setIsBlockView(!isBlockView);
  };

  const handleExpandToggle = () => {
    setIsAllExpanded(!isAllExpanded);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <Header
          isBlockView={isBlockView}
          onViewToggle={handleViewToggle}
          onReset={handleReset}
          onExpandToggle={handleExpandToggle}
          isAllExpanded={isAllExpanded}
        />
        <SharedJsonView 
          onJsonLoad={handleSharedJsonLoad} 
          onFreezeJsonLoad={handleFreezeJsonLoad}
          setSnackbarMessage={setSnackbarMessage}
        />
        {snackbarMessage && (
          <Snackbar
            open={Boolean(snackbarMessage)}
            autoHideDuration={6000}
            onClose={() => setSnackbarMessage('')}
          >
            <Alert 
              onClose={() => setSnackbarMessage('')} 
              severity="error"
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        )}
        <main className="main-content">
          {isBlockView ? (
            <JsonBlocks
              data={jsonData}
              freezeData={freezeJsonData}
              onChange={handleJsonChange}
              isAllExpanded={isAllExpanded}
              levelColors={levelColors}
            />
          ) : (
            <JsonEditor
              jsonData={jsonData}
              onChange={handleJsonChange}
            />
          )}
        </main>
        <SpeedInsights />
      </div>
    </ThemeProvider>
  );
}

export default App;
