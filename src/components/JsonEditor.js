import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Paper, Box, Alert } from '@mui/material';
import Editor from '@monaco-editor/react';

const JsonEditor = forwardRef(({ value, onChange }, ref) => {
  const [editorInstance, setEditorInstance] = useState(null);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    setValue: (newValue) => {
      if (editorInstance) {
        editorInstance.setValue(newValue);
        setError(null);
      }
    }
  }));

  const handleEditorChange = (newValue) => {
    try {
      const parsedJson = JSON.parse(newValue);
      onChange(parsedJson);
      setError(null);
    } catch (e) {
      // Show detailed error message
      setError({
        message: e.message,
        line: e.lineNumber,
        column: e.columnNumber
      });
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    
    // Set up JSON language configuration
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true,
      schemaValidation: 'error'
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 1,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {`JSON Error: ${error.message}`}
        </Alert>
      )}
      <Paper 
        elevation={3} 
        sx={{ 
          flexGrow: 1,
          '& .monaco-editor': {
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace !important'
          }
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="json"
          defaultValue={JSON.stringify(value, null, 2)}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on'
          }}
        />
      </Paper>
    </Box>
  );
});

export default JsonEditor;
