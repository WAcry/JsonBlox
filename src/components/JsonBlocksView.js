// JsonBlocksView.js

import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Stack,
  Tooltip,
  Button,
  Snackbar,
  Alert,
  Breadcrumbs,
  Typography,
  Chip,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowUpward,
  ArrowDownward,
  NavigateNext,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as ResetIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import JsonBlock from './JsonBlock';
import JsonEditor from './JsonEditor';
import JsonDiffView from './JsonDiffView';
import { storeJsonData } from '../store';

const JsonBlocksView = (props) => {
  const {
    data,
    onChange,
    isAllExpanded,
    levelColors,
    // State variables
    isGloballyExpanded,
    setIsGloballyExpanded,
    activeTab,
    setActiveTab,
    resetConfirmation,
    handleReset,
    searchKeywords,
    setSearchKeywords,
    currentSearchText,
    setCurrentSearchText,
    handleKeyDown,
    matchingPaths,
    currentMatchIndex,
    handlePreviousMatch,
    handleNextMatch,
    handleRemoveKeyword,
    currentPath,
    handleBreadcrumbClick,
    filteredItems,
    listRef,
    handleScroll,
    handleToggleExpand,
    handleMove,
    handleDelete,
    handleEdit,
    handleAddField,
    snackbar,
    setSnackbar,
    frozenData,
    isFrozen,
    handleToggleFreeze,
  } = props;

  const [shareSnackbarOpen, setShareSnackbarOpen] = useState(false);
  const [shareSnackbarMessage, setShareSnackbarMessage] = useState('');

  const editorRef = useRef(null);

  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [unfreezeConfirmation, setUnfreezeConfirmation] = useState(false);

  const handleClearJson = useCallback(() => {
    if (clearConfirmation) {
      onChange({});
      if (editorRef.current) {
        editorRef.current.setValue(JSON.stringify({}, null, 2));
      }
      setClearConfirmation(false);
    } else {
      setClearConfirmation(true);
      setTimeout(() => setClearConfirmation(false), 3000);
    }
  }, [onChange, clearConfirmation]);

  const handleToggleFreezeWithConfirmation = useCallback(() => {
    if (unfreezeConfirmation || !isFrozen) {
      props.handleToggleFreeze();
      setUnfreezeConfirmation(false);
    } else {
      setUnfreezeConfirmation(true);
      setTimeout(() => setUnfreezeConfirmation(false), 3000);
    }
  }, [props.handleToggleFreeze, isFrozen, unfreezeConfirmation]);

  const handleShare = async () => {
    try {
      const suffix = await storeJsonData(frozenData, data);
      const fullUrl = `${window.location.origin}?share=${suffix}&tab=${activeTab}`;
      navigator.clipboard.writeText(fullUrl);
      setShareSnackbarMessage('Share URL copied to clipboard!');
      setShareSnackbarOpen(true);
    } catch (error) {
      console.error('Error sharing JSON:', error);
      setShareSnackbarMessage('Error generating share URL');
      setShareSnackbarOpen(true);
    }
  };

  // Define the Row component here
  const Row = ({ index, style }) => {
    const item = filteredItems[index];
    const isCurrentMatch = searchKeywords.length > 0 && matchingPaths[currentMatchIndex] === item.path;

    return (
      <JsonBlock
        {...item}
        jsonKey={item.key}
        style={style}
        color={levelColors[item.level % levelColors.length]}
        onToggleExpand={() => handleToggleExpand(item.path)}
        onMove={(direction) => handleMove(item.path, direction)}
        onDelete={() => !item.isDummyRoot && handleDelete(item.path)}
        onEdit={(path, newKey, newValue) => !item.isDummyRoot && handleEdit(path, newKey, newValue)}
        onAddField={() => handleAddField(item.path)}
        searchQuery={searchKeywords.join(' ')}
        isCurrentMatch={isCurrentMatch}
      />
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ flex: 1 }}
            TabIndicatorProps={{
              sx: { transition: 'none' }
            }}
          >
            <Tab
              disableRipple
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>Block View</span>
                  {activeTab === 0 && (
                    <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                      <Button
                        size="small"
                        startIcon={isGloballyExpanded ? <CollapseIcon /> : <ExpandIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGloballyExpanded(!isGloballyExpanded);
                        }}
                        variant="outlined"
                        sx={{ ml: 1 }}
                      >
                        {isGloballyExpanded ? 'Collapse All' : 'Expand All'}
                      </Button>
                    </Stack>
                  )}
                </Box>
              }
            />
            <Tab 
              disableRipple
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>JSON View</span>
                  {activeTab === 1 && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearJson();
                      }}
                      variant="outlined"
                      color={clearConfirmation ? "warning" : "inherit"}
                      sx={{ ml: 1 }}
                    >
                      {clearConfirmation ? "Confirm Clear" : "Clear"}
                    </Button>
                  )}
                </Box>
              }
            />
            <Tab
              disableRipple
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>Diff View</span>
                  {activeTab === 2 && (
                    <Button
                      size="small"
                      startIcon={isFrozen ? <LockOpenIcon /> : <LockIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFreezeWithConfirmation();
                      }}
                      variant="outlined"
                      color={unfreezeConfirmation ? "warning" : "inherit"}
                      sx={{ ml: 1 }}
                    >
                      {unfreezeConfirmation ? "Confirm Unfreeze" : (isFrozen ? "Unfreeze" : "Freeze")}
                    </Button>
                  )}
                </Box>
              }
            />
          </Tabs>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              variant="outlined"
              sx={{ ml: 2 }}
            >
              Share
            </Button>
            <Tooltip title={resetConfirmation ? "Click again to confirm example load" : "Load Example"}>
              <Button
                size="small"
                startIcon={<ResetIcon />}
                onClick={handleReset}
                variant="outlined"
                color={resetConfirmation ? "warning" : "inherit"}
                sx={{
                  ml: 2,
                  animation: resetConfirmation ? 'pulse 1s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                    '100%': { opacity: 1 },
                  }
                }}
              >
                Example
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      </Box>

      {activeTab === 0 && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ pt: 1, pb: 0.5, gap: 1, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <IconButton
                onClick={handlePreviousMatch}
                size="small"
                disabled={matchingPaths.length === 0}
              >
                <ArrowUpward />
              </IconButton>
              <IconButton
                onClick={handleNextMatch}
                size="small"
                disabled={matchingPaths.length === 0}
              >
                <ArrowDownward />
              </IconButton>
              <TextField
                size="small"
                placeholder="Search..."
                value={currentSearchText}
                onChange={(e) => setCurrentSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{ flex: 1 }}
                helperText={currentSearchText ? "Press Enter To Highlight" : ""}
                FormHelperTextProps={{
                  sx: {
                    m: 0,
                    mt: 0.5,
                    lineHeight: 1
                  }
                }}
              />
            </Box>
            {(searchKeywords.length > 0 || currentSearchText) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {matchingPaths.length === 0 ? '0 matches' : `${currentMatchIndex + 1} of ${matchingPaths.length} matches`}
                </Typography>
                {searchKeywords.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchKeywords([]);
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                {searchKeywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    onDelete={() => handleRemoveKeyword(keyword)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ p: 0.5, bgcolor: 'background.paper' }}>
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              sx={{
                '& .MuiBreadcrumbs-ol': {
                  flexWrap: 'wrap',
                  gap: '4px 8px'
                },
                '& .MuiBreadcrumbs-separator': {
                  margin: 0
                }
              }}
            >
              {currentPath.map((item, index) => (
                <Typography
                  key={item.path}
                  variant="body2"
                  onClick={() => handleBreadcrumbClick(item.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: index === currentPath.length - 1 ? 'text.primary' : 'text.secondary',
                    whiteSpace: 'normal',
                    wordBreak: 'break-all',
                    lineHeight: 1.2,
                    py: 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: 'primary.main'
                    }
                  }}
                >
                  {item.name}
                  {item.type === 'array' && ' []'}
                  {item.type === 'object' && !item.isArray && ' {}'}
                </Typography>
              ))}
            </Breadcrumbs>
          </Box>
          <Paper
            elevation={2}
            sx={{
              height: 'calc(100vh - 64px)',
              width: '100%',
              overflow: 'hidden',
              pb: 2
            }}
          >
            <Box sx={{ height: '100%', width: '100%' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    ref={listRef}
                    height={height}
                    width={width}
                    itemCount={filteredItems.length}
                    itemSize={48}
                    onScroll={handleScroll}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            </Box>
          </Paper>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <JsonEditor ref={editorRef} value={data} onChange={onChange} />
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <JsonDiffView
            originalValue={isFrozen ? frozenData : data}
            modifiedValue={data}
            isFrozen={isFrozen}
            onToggleFreeze={handleToggleFreeze}
          />
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={shareSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setShareSnackbarOpen(false)}
        message={shareSnackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default JsonBlocksView;
