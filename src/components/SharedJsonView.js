import React, { useEffect, useRef, useState } from 'react';
import { getJsonData } from '../store';

const SharedJsonView = ({ onJsonLoad, onFreezeJsonLoad, setSnackbarMessage }) => {
  const hasLoaded = useRef(false);

  useEffect(() => {
    const loadSharedJson = async () => {
      if (hasLoaded.current) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      
      if (shareId) {
        try {
          const data = await getJsonData(shareId);
          if (data) {
            onJsonLoad(data.nonFreezeJson);
            if (onFreezeJsonLoad) {
              onFreezeJsonLoad(data.freezeJson);
            }
            hasLoaded.current = true;
          }
        } catch (error) {
          console.error('Error loading shared JSON:', error);
          setSnackbarMessage('Failed to load the shared JSON or expired. Please try refresh.');
        }
      }
    };

    loadSharedJson();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies since we only want to load once

  return null;
};

export default SharedJsonView;