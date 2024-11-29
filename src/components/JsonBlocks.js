// JsonBlocks.js

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import JsonBlocksView from './JsonBlocksView';
import { defaultJson } from '../utils/constants';
import { storeJsonData } from '../store';

const JsonBlocks = ({ data, onChange, isAllExpanded, levelColors, freezeData }) => {
  // State variables
  const [collapsedBlocks, setCollapsedBlocks] = useState(new Set());
  const [isGloballyExpanded, setIsGloballyExpanded] = useState(isAllExpanded);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchingPaths, setMatchingPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [searchKeywords, setSearchKeywords] = useState([]);
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  // New state for diff view
  const [activeTab, setActiveTab] = useState(0);
  const [isFrozen, setIsFrozen] = useState(true);
  const [frozenData, setFrozenData] = useState(null);

  // Add reset confirmation state
  const [resetConfirmation, setResetConfirmation] = useState(false);
  const resetTimeoutRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId) {
      if (freezeData && freezeData !== defaultJson) {
        setFrozenData(freezeData);
      }
    } 
    else if (frozenData === null) {
      setFrozenData(defaultJson);
    }
  }, [freezeData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 2) {
        setActiveTab(tabIndex);
      }
    }
  }, []);

  const listRef = useRef(null);

  useEffect(() => {
    setIsGloballyExpanded(isAllExpanded);
    if (isAllExpanded) {
      // When expanding globally, clear all collapsed states
      setCollapsedBlocks(new Set());
    } else {
      // When collapsing globally, collapse all blocks except root
      const allPaths = new Set(flattenJson(data).map(item => item.path).filter(path => path !== 'root'));
      setCollapsedBlocks(allPaths);
    }
  }, [isAllExpanded]);

  // Clear reset confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Flatten JSON to array structure with parent-child relationships
  const flattenJson = useCallback((obj, path = '', level = 0, parentPath = null) => {
    let items = [];

    // Add dummy root node
    if (level === 0) {
      items.push({
        path: 'root',
        key: 'root',
        value: obj,
        level: 0,
        type: 'object',
        isExpanded: true, // Root node is always expanded
        isArray: false,
        parentPath: null,
        isDummyRoot: true
      });
      level++;
      path = 'root';
    }

    if (typeof obj !== 'object' || obj === null) {
      return [{
        path,
        key: path.split('.').pop(),
        value: obj,
        level,
        type: 'primitive',
        parentPath,
        isDummyRoot: false
      }];
    }

    const isArray = Array.isArray(obj);

    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      // Block is expanded if not in collapsedBlocks set
      const isExpanded = !collapsedBlocks.has(currentPath);

      items.push({
        path: currentPath,
        key,
        value,
        level,
        type: typeof value === 'object' && value !== null ? (isArray ? 'array' : 'object') : 'primitive',
        isExpanded,
        isArray,
        parentPath,
        isDummyRoot: false
      });

      if (typeof value === 'object' && value !== null && isExpanded) {
        items = items.concat(flattenJson(value, currentPath, level + 1, currentPath));
      }
    });

    return items;
  }, [collapsedBlocks]);

  const findMatchingPaths = useCallback((items, keywords, currentText) => {
    if (!keywords.length && !currentText) return [];

    const allSearchTerms = [...keywords];
    if (currentText) {
      allSearchTerms.push(currentText);
    }

    const matches = [];
    items.forEach(item => {
      const itemText = `${item.key}${String(item.value)}`.toLowerCase();
      const isMatch = allSearchTerms.some(term =>
        itemText.includes(term.toLowerCase())
      );

      if (isMatch) {
        matches.push(item.path);
      }
    });

    return matches;
  }, []);

  const filteredItems = useMemo(() => {
    const items = flattenJson(data);
    const matches = findMatchingPaths(items, searchKeywords, currentSearchText);
    setMatchingPaths(matches);
    return items;
  }, [data, searchKeywords, currentSearchText, flattenJson, findMatchingPaths]);

  // Handle toggling block expansion
  const handleToggleExpand = useCallback((path) => {
    setCollapsedBlocks(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(path)) {
        newCollapsed.delete(path);
      } else {
        newCollapsed.add(path);
      }
      return newCollapsed;
    });
  }, []);

  const handleMove = useCallback((path, direction) => {
    // Skip root node itself
    if (path === 'root') return;

    const pathParts = path.split('.');
    // Special handling for root-level nodes
    const isRootLevel = pathParts.length === 2 && pathParts[0] === 'root';
    if (isRootLevel) {
      const key = pathParts[1];
      const keys = Object.keys(data);
      const currentIndex = keys.indexOf(key);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= keys.length) return;

      const targetKey = keys[newIndex];
      const reorderedData = {};

      keys.forEach((k, index) => {
        if (index === newIndex) {
          if (direction === 'up') {
            reorderedData[key] = data[key];
            reorderedData[targetKey] = data[targetKey];
          } else {
            reorderedData[targetKey] = data[targetKey];
            reorderedData[key] = data[key];
          }
        } else if (k !== key && k !== targetKey) {
          reorderedData[k] = data[k];
        }
      });

      onChange(reorderedData);
      return;
    }

    // Handle non-root level nodes as before
    if (pathParts[0] === 'root') {
      pathParts.shift();
    }
    const key = pathParts.pop();
    const parentPath = pathParts.join('.');

    const newData = { ...data };
    // Get parent object - if no parentPath, use root data object
    const parent = parentPath ? getNestedValue(newData, parentPath) : newData;
    if (!parent || typeof parent !== 'object') return;

    const keys = Object.keys(parent);
    const currentIndex = keys.indexOf(key);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= keys.length) return;

    if (Array.isArray(parent)) {
      [parent[currentIndex], parent[newIndex]] = [parent[newIndex], parent[currentIndex]];
    } else {
      const targetKey = keys[newIndex];
      const reorderedParent = {};
      keys.forEach((k, index) => {
        if (index === newIndex) {
          if (direction === 'up') {
            reorderedParent[key] = parent[key];
            reorderedParent[targetKey] = parent[targetKey];
          } else {
            reorderedParent[targetKey] = parent[targetKey];
            reorderedParent[key] = parent[key];
          }
        } else if (k !== key && k !== targetKey) {
          reorderedParent[k] = parent[k];
        }
      });

      if (parentPath) {
        const parentParts = parentPath.split('.');
        let current = newData;
        for (let i = 0; i < parentParts.length - 1; i++) {
          current = current[parentParts[i]];
        }
        current[parentParts[parentParts.length - 1]] = reorderedParent;
      } else {
        Object.assign(newData, reorderedParent);
      }
    }

    onChange(newData);
  }, [data, onChange]);

  const handleDelete = useCallback((path) => {
    // Skip root node
    if (path === 'root') return;

    const pathParts = path.split('.');
    // Remove 'root' from path parts if it exists
    if (pathParts[0] === 'root') {
      pathParts.shift();
    }
    const key = pathParts.pop();
    const parentPath = pathParts.join('.');

    const newData = { ...data };
    // Get parent object - if no parentPath, use root data object
    const parent = parentPath ? getNestedValue(newData, parentPath) : newData;
    if (!parent || typeof parent !== 'object') return;

    if (Array.isArray(parent)) {
      parent.splice(parseInt(key), 1);
    } else {
      delete parent[key];
    }

    onChange(newData);
  }, [data, onChange]);

  const handleEdit = useCallback((path, newKey, newValue) => {
    // Skip root node
    if (path === 'root') return;

    // Validate key is not empty
    if (!newKey || newKey.trim() === '') {
      setSnackbar({
        open: true,
        message: 'Key cannot be empty',
        severity: 'error'
      });
      return;
    }

    // Initialize parsedValue
    let parsedValue;

    // Handle empty value or null
    if (newValue === '') {
      parsedValue = null;
    } else if (newValue === null || newValue === 'null') {
      parsedValue = null;
    } else {
      // Validate and parse value
      const trimmedValue = String(newValue).trim();

      // Handle special cases
      if (trimmedValue.toLowerCase() === 'true') {
        parsedValue = true;
      } else if (trimmedValue.toLowerCase() === 'false') {
        parsedValue = false;
      }
      // Try parsing as array if starts with [
      else if (trimmedValue.startsWith('[')) {
        try {
          parsedValue = JSON.parse(trimmedValue);
          if (!Array.isArray(parsedValue)) {
            setSnackbar({
              open: true,
              message: 'Invalid array format',
              severity: 'error'
            });
            return;
          }
        } catch (e) {
          setSnackbar({
            open: true,
            message: 'Invalid array format',
            severity: 'error'
          });
          return;
        }
      }
      // Try parsing as object if starts with {
      else if (trimmedValue.startsWith('{')) {
        try {
          parsedValue = JSON.parse(trimmedValue);
          if (typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
            setSnackbar({
              open: true,
              message: 'Invalid object format',
              severity: 'error'
            });
            return;
          }
        } catch (e) {
          setSnackbar({
            open: true,
            message: 'Invalid object format',
            severity: 'error'
          });
          return;
        }
      }
      // Try parsing as number (including 0)
      else if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
        parsedValue = Number(trimmedValue);
      }
      // Must be a quoted string
      else if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
        parsedValue = trimmedValue.slice(1, -1);
      }
      else {
        setSnackbar({
          open: true,
          message: 'Value must be either:\n• A number\n• A quoted string (e.g. "hello")\n• A valid JSON object (e.g. {"key": "value"})\n• A valid array (e.g. [1, 2, 3])\n• true or false\n• null',
          severity: 'warning'
        });
        return;
      }
    }

    const pathParts = path.split('.');
    if (pathParts[0] === 'root') {
      pathParts.shift();
    }
    const key = pathParts.pop();
    const parentPath = pathParts.join('.');

    const newData = { ...data };
    const parent = parentPath ? getNestedValue(newData, parentPath) : newData;
    if (!parent || typeof parent !== 'object') return;

    if (key !== newKey) {
      setCollapsedBlocks(prev => {
        const newCollapsed = new Set();
        const oldPrefix = path;
        const newPrefix = parentPath ? 
          (parentPath === '' ? `root.${newKey}` : `root.${parentPath}.${newKey}`) : 
          `root.${newKey}`;

        prev.forEach(collapsedPath => {
          if (collapsedPath === oldPrefix) {
            newCollapsed.add(newPrefix);
          } else if (collapsedPath.startsWith(oldPrefix + '.')) {
            const newPath = newPrefix + collapsedPath.substring(oldPrefix.length);
            newCollapsed.add(newPath);
          } else {
            newCollapsed.add(collapsedPath);
          }
        });

        return newCollapsed;
      });
    }

    // Create a new object maintaining the order of properties
    if (key !== newKey) {
      const orderedParent = {};
      Object.keys(parent).forEach(k => {
        if (k === key) {
          orderedParent[newKey] = parsedValue;
        } else {
          orderedParent[k] = parent[k];
        }
      });
      // Copy ordered properties back to parent
      Object.keys(parent).forEach(k => delete parent[k]);
      Object.assign(parent, orderedParent);
    } else {
      parent[newKey] = parsedValue;
    }

    onChange(newData);
  }, [data, onChange, setCollapsedBlocks]);

  const handleAddField = useCallback((path) => {
    const newData = { ...data };
    let targetObj;

    if (path === 'root') {
      // Adding to root level
      targetObj = newData;
    } else {
      // Adding to nested level
      const pathParts = path.split('.');
      // Remove 'root' from path parts if it exists
      if (pathParts[0] === 'root') {
        pathParts.shift();
      }
      targetObj = pathParts.length === 0 ? newData : getNestedValue(newData, pathParts.join('.'));
    }

    if (!targetObj || typeof targetObj !== 'object') return;

    // Generate new field name
    let newFieldName = "newField";
    let counter = 0;
    while (newFieldName in targetObj) {
      counter++;
      newFieldName = `newField${counter}`;
    }

    // Add new field
    if (Array.isArray(targetObj)) {
      targetObj.push("");
    } else {
      targetObj[newFieldName] = "";
    }

    onChange(newData);
  }, [data, onChange]);

  const scrollToMatch = useCallback((index) => {
    const itemIndex = filteredItems.findIndex(item => item.path === matchingPaths[index]);
    if (itemIndex !== -1 && listRef.current) {
      const itemHeight = 48; // This should match the itemSize in the List component
      const listHeight = listRef.current._outerRef.clientHeight;
      const totalHeight = filteredItems.length * itemHeight;
      
      // Calculate the ideal scroll position to center the item
      const targetOffset = Math.max(0, (itemIndex * itemHeight) - (listHeight / 2) + (itemHeight / 2));
      
      // Ensure we don't scroll past the bottom
      const maxScroll = Math.max(0, totalHeight - listHeight);
      const finalOffset = Math.min(targetOffset, maxScroll);
      
      // Scroll to the calculated offset
      listRef.current.scrollTo(finalOffset);
    }
  }, [matchingPaths, filteredItems]);

  const handleNextMatch = useCallback(() => {
    if (matchingPaths.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matchingPaths.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [matchingPaths.length, currentMatchIndex, scrollToMatch]);

  const handlePreviousMatch = useCallback(() => {
    if (matchingPaths.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matchingPaths.length) % matchingPaths.length;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  }, [matchingPaths.length, currentMatchIndex, scrollToMatch]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && currentSearchText.trim()) {
      setSearchKeywords(prev => [...prev, currentSearchText.trim()]);
      setCurrentSearchText('');
    }
  }, [currentSearchText]);

  const handleRemoveKeyword = useCallback((keywordToRemove) => {
    setSearchKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  }, []);

  const handleBreadcrumbClick = useCallback((path) => {
    // Find the index of the item in filteredItems
    const itemIndex = filteredItems.findIndex(item => item.path === path);
    if (itemIndex !== -1 && listRef.current) {
      // Calculate the offset to position the item at the first line
      const itemHeight = 48; // This should match the itemSize in the List component
      const targetOffset = Math.max(0, itemIndex * itemHeight);

      // Scroll to the calculated offset
      listRef.current.scrollTo(targetOffset);

      // Ensure all parent nodes are expanded
      const pathParts = path.split('.');
      let currentPath = '';
      pathParts.forEach(part => {
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        if (currentPath !== 'root') {
          setCollapsedBlocks(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentPath);
            return newSet;
          });
        }
      });
    }
  }, [filteredItems]);

  // Function to get path information for a visible item
  const handleScroll = useCallback(({ scrollOffset }) => {
    if (listRef.current) {
      const itemHeight = 48; // This should match the itemSize in the List component
      const visibleIndex = Math.floor(scrollOffset / itemHeight);
      const item = filteredItems[visibleIndex];

      if (item) {
        const pathParts = item.path.split('.');
        const breadcrumbPath = [];
        let currentPathStr = '';

        pathParts.forEach((part, index) => {
          if (part === 'root' && index === 0) {
            breadcrumbPath.push({ name: 'root', path: 'root' });
            currentPathStr = 'root';
          } else {
            currentPathStr = currentPathStr ? `${currentPathStr}.${part}` : part;
            const pathItem = filteredItems.find(i => i.path === currentPathStr);
            if (pathItem) {
              breadcrumbPath.push({
                name: pathItem.key,
                path: currentPathStr,
                type: pathItem.type,
                isArray: pathItem.isArray
              });
            }
          }
        });

        setCurrentPath(breadcrumbPath);
      }
    }
  }, [filteredItems]);

  // Utility function to get nested value from object using dot notation
  const getNestedValue = (obj, path) => {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Your functions: flattenJson, findMatchingPaths, filteredItems, handleToggleExpand, etc.
  // Make sure to include all functions you had in your original code.

  // Here, include all the functions from your original code, adjusted as needed.

  // For brevity, I'm including only the key functions. Please make sure to include all functions.

  const handleReset = () => {
    if (!resetConfirmation) {
      setResetConfirmation(true);
      resetTimeoutRef.current = setTimeout(() => {
        setResetConfirmation(false);
      }, 2000); // Reset after 2 seconds
    } else {
      onChange(defaultJson);
      setResetConfirmation(false);
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      // Reset expansion state
      setIsGloballyExpanded(false);
      const allPaths = new Set(flattenJson(defaultJson).map(item => item.path).filter(path => path !== 'root'));
      setCollapsedBlocks(allPaths);
    }
  };

  // Example of handleToggleFreeze function
  const handleToggleFreeze = () => {
    if (!isFrozen) {
      // When freezing, store the current data
      setFrozenData(data);
    } else {
      // When unfreezing, update the data and clear frozen state
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      // Clear frozen data when unfreezing
      setFrozenData(null);
      // Update data to sync with current state
      onChange(data);
    }
    setIsFrozen(!isFrozen);
  };

  // Now, render the JsonBlocksView component with all necessary props
  return (
    <JsonBlocksView
      data={data}
      onChange={onChange}
      isAllExpanded={isAllExpanded}
      levelColors={levelColors}
      isGloballyExpanded={isGloballyExpanded}
      setIsGloballyExpanded={(expanded) => {
        // This handler will be called from JsonBlocksView
        if (expanded) {
          setCollapsedBlocks(new Set());
        } else {
          const allPaths = new Set(flattenJson(data).map(item => item.path).filter(path => path !== 'root'));
          setCollapsedBlocks(allPaths);
        }
        setIsGloballyExpanded(expanded);
      }}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      resetConfirmation={resetConfirmation}
      handleReset={handleReset}
      searchKeywords={searchKeywords}
      setSearchKeywords={setSearchKeywords}
      currentSearchText={currentSearchText}
      setCurrentSearchText={setCurrentSearchText}
      handleKeyDown={handleKeyDown}
      matchingPaths={matchingPaths}
      currentMatchIndex={currentMatchIndex}
      handlePreviousMatch={handlePreviousMatch}
      handleNextMatch={handleNextMatch}
      handleRemoveKeyword={handleRemoveKeyword}
      currentPath={currentPath}
      handleBreadcrumbClick={handleBreadcrumbClick}
      filteredItems={filteredItems}
      listRef={listRef}
      handleScroll={handleScroll}
      handleToggleExpand={handleToggleExpand}
      handleMove={handleMove}
      handleDelete={handleDelete}
      handleEdit={handleEdit}
      handleAddField={handleAddField}
      snackbar={snackbar}
      setSnackbar={setSnackbar}
      frozenData={frozenData}
      isFrozen={isFrozen}
      handleToggleFreeze={handleToggleFreeze}
    />
  );
};

export default JsonBlocks;