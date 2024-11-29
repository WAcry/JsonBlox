import React from 'react';
import { Box } from '@mui/material';
import { DiffEditor } from '@monaco-editor/react';

const JsonDiffView = ({ originalValue, modifiedValue }) => {
  const options = {
    originalEditable: false,
    modifiedEditable: false,
    renderSideBySide: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
    lineNumbers: 'on',
    readOnly: true,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    }
  };

  // Format JSON with proper indentation
  const formatJson = (json) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return '';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      </Box>
      <Box 
        sx={{ 
          flexGrow: 1,
          position: 'relative',
          '& .monaco-diff-editor': {
            position: 'absolute !important',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace !important',
            '& .diffOverview': {
              display: 'none !important'
            },
            '& .editor.original, & .editor.modified': {
              width: '50% !important',
              minWidth: '0 !important',
              fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace !important'
            },
            '& .editor.modified': {
              left: '50% !important',
              marginLeft: '0 !important'
            }
          }
        }}
      >
        <DiffEditor
          height="100%"
          language="json"
          original={formatJson(originalValue)}
          modified={formatJson(modifiedValue)}
          options={options}
          theme="vs-light"
        />
      </Box>
    </Box>
  );
};

export default JsonDiffView;
