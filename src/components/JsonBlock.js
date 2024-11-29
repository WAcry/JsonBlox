import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Component that only shows tooltip when text is truncated
const TruncatedText = ({ text, sx, children }) => {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current;
      if (element) {
        setIsTruncated(element.scrollWidth > element.clientWidth);
      }
    };

    checkTruncation();
    // Add resize listener to recheck truncation when window size changes
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text]); // Re-check when text changes

  const textComponent = (
    <Typography
      ref={textRef}
      variant="body2"
      component="span"
      sx={sx}
    >
      {children}
    </Typography>
  );

  return isTruncated ? (
    <Tooltip title={text}>
      {textComponent}
    </Tooltip>
  ) : textComponent;
};

const JsonBlock = ({
  path,
  jsonKey,
  value,
  level,
  type,
  isExpanded,
  isArray,
  style,
  color,
  isDummyRoot,
  onToggleExpand,
  onMove,
  onDelete,
  onEdit,
  onAddField,
  searchQuery,
  isCurrentMatch,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editKey, setEditKey] = useState('');
  const [showValidationTip, setShowValidationTip] = useState(false);
  const [tipPosition, setTipPosition] = useState('bottom');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const deleteTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showValidationTip && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const tipHeight = 180; // Approximate height of the validation tip

      const spaceAbove = inputRect.top;
      const spaceBelow = windowHeight - inputRect.bottom;

      // If there's not enough space below and more space above, show on top
      if (spaceBelow < tipHeight && spaceAbove > spaceBelow) {
        setTipPosition('top');
      } else {
        setTipPosition('bottom');
      }
    }
  }, [showValidationTip]);

  const handleCopy = () => {
    const textToCopy = isDummyRoot
      ? JSON.stringify(value, null, 2)
      : JSON.stringify({ [jsonKey]: value }, null, 2);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowCopySuccess(true);
    });
  };

  const handleSave = () => {
    let parsedValue = editValue;
    if (type === 'primitive') {
      if (editValue === '' || editValue.toLowerCase() === 'null') {
        parsedValue = null;
      }
      else if (editValue.toLowerCase() === 'true') {
        parsedValue = true;
      } else if (editValue.toLowerCase() === 'false') {
        parsedValue = false;
      }
      else if (!isNaN(editValue) && editValue.trim() !== '') {
        parsedValue = Number(editValue);
      }
    }

    onEdit(path, editKey, parsedValue);
    setIsEditing(false);
  };

  const handleAddField = () => {
    onAddField(path);
  };

  const handleEditClick = () => {
    if (isArray && type !== 'primitive') return;
    
    const initialValue = typeof value === 'string' ? `"${value}"` : 
                        typeof value === 'object' ? JSON.stringify(value) : 
                        String(value);
    setEditValue(initialValue);
    setEditKey(isArray ? jsonKey : jsonKey);
    setIsEditing(true);
    setShowValidationTip(true);
  };

  const handleDelete = () => {
    if (!deleteConfirmation) {
      setDeleteConfirmation(true);
      deleteTimeoutRef.current = setTimeout(() => {
        setDeleteConfirmation(false);
      }, 2000); // Reset after 2 seconds
    } else {
      onDelete(path);
      setDeleteConfirmation(false);
    }
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const keywords = query.split(' ').filter(k => k.trim());
    if (keywords.length === 0) return text;

    // Create a regex pattern that matches any of the keywords
    const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.toString().split(pattern);
    
    return parts.map((part, index) => {
      const isMatch = keywords.some(keyword => 
        part.toLowerCase() === keyword.toLowerCase()
      );
      return isMatch ? 
        <span key={index} style={{ backgroundColor: '#1976d2', color: '#ffffff' }}>{part}</span> : 
        part;
    });
  };

  const indentation = level * 2;

  return (
    <Box
      data-path={path}
      sx={{
        display: 'flex',
        alignItems: 'center',
        pl: indentation,
        borderLeft: isDummyRoot ? 'none' : `4px solid ${color}`,
        borderBottom: '1px solid #e0e0e0', // Added borderBottom
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Added boxShadow
        borderRadius: '8px', // Added borderRadius
        backgroundColor: isCurrentMatch ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        '&:hover': {
          backgroundColor: isCurrentMatch ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
        minWidth: 0, 
        minHeight: '48px',
        ...style
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
        {/* Consistent width placeholder for expand/collapse button */}
        <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
          {type !== 'primitive' && !isDummyRoot && (
            <IconButton size="small" onClick={() => onToggleExpand(path)}>
              {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          )}
        </Box>
        
        {isDummyRoot ? (
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {jsonKey}
          </Typography>
        ) : (
          isEditing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <TextField
                size="small"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                sx={{ 
                  width: '150px',
                  visibility: isDummyRoot ? 'hidden' : 'visible',
                }}
                disabled={isArray}
              />
              <Box sx={{ position: 'relative', flex: 1 }}>
                {showValidationTip && (
                  <Alert 
                    ref={tipRef}
                    severity="info"
                    variant="filled"
                    sx={{ 
                      position: 'absolute',
                      ...(tipPosition === 'top' ? {
                        bottom: '100%',
                        mb: 0.5,
                      } : {
                        top: '100%',
                        mt: 0.5,
                      }),
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      boxShadow: 3,
                      '& .MuiAlert-message': {
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Value must be one of:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ pl: 1 }}>
                      • A number (e.g., 42)<br/>
                      • A quoted string (e.g., "hello")<br/>
                      • A valid JSON object (e.g., {'{'}key: "value"{'}'})<br/>
                      • A valid array (e.g., [1, 2, 3])<br/>
                      • true or false<br/>
                      • null
                    </Typography>
                  </Alert>
                )}
                <TextField
                  inputRef={inputRef}
                  size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  sx={{ width: '100%' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSave();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setShowValidationTip(false);
                    }
                  }}
                  onFocus={() => setShowValidationTip(true)}
                  onBlur={() => setShowValidationTip(false)}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, mr: 1 }}>
              <TruncatedText
                text={highlightText(jsonKey, searchQuery)}
                sx={{
                  fontWeight: 'medium',
                  mr: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '200px'
                }}
              >
                {highlightText(jsonKey, searchQuery)}
                {type !== 'primitive' && (
                  Array.isArray(value) ? 
                    ` [${value.length}]` : 
                    ` {${Object.keys(value).length}}`
                )}
              </TruncatedText>

              {type === 'primitive' && (
                <TruncatedText
                  text={highlightText(String(value), searchQuery)}
                  sx={{
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '300px'
                  }}
                >
                  {highlightText(String(value), searchQuery)}
                </TruncatedText>
              )}
            </Box>
          )
        )}
      </Box>

      <Box sx={{ display: 'flex', ml: 'auto', flexShrink: 0 }}>
        {/* Add field button for objects and arrays */}
        {type !== 'primitive' && (
          <Tooltip title="Add Field">
            <IconButton size="small" onClick={handleAddField}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
        {/* Copy button for all nodes */}
        <Tooltip title={isDummyRoot ? "Copy All" : "Copy"}>
          <IconButton size="small" onClick={handleCopy}>
            <CopyIcon />
          </IconButton>
        </Tooltip>

        {/* Other buttons only for non-root nodes */}
        {!isDummyRoot && (
          <>
            <Tooltip title="Move Up">
              <IconButton
                size="small"
                onClick={() => onMove('up')}
              >
                <ArrowUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Move Down">
              <IconButton
                size="small"
                onClick={() => onMove('down')}
              >
                <ArrowDownIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={deleteConfirmation ? "Click again to confirm delete" : "Delete"}>
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ 
                  color: deleteConfirmation ? 'warning.main' : 'error.main',
                  animation: deleteConfirmation ? 'pulse 1s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                    '100%': { opacity: 1 },
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isEditing ? (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Save">
                  <IconButton size="small" onClick={handleSave}>
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton size="small" onClick={() => {
                    setIsEditing(false);
                    setShowValidationTip(false);
                  }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={handleEditClick}
                  disabled={isArray && type !== 'primitive'}
                  sx={{
                    visibility: isDummyRoot ? 'hidden' : 'visible',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default JsonBlock;
