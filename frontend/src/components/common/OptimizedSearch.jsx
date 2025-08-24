import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSearch, HiX } from 'react-icons/hi';
import { useDebounce } from '../../hooks/useDebounce';
import Avatar from '../ui/Avatar';
import { Link } from 'react-router-dom';

const OptimizedSearch = ({
  onSearch,
  placeholder = "Search...",
  className = "",
  showResults = true,
  onResultClick,
  searchEndpoint,
  renderResult,
  debounceDelay = 300,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, debounceDelay);
  
  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim().length === 0) {
        setResults([]);
        setShowDropdown(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (searchEndpoint) {
          const response = await fetch(searchEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify({ query: debouncedQuery })
          });

          if (!response.ok) {
            throw new Error('Search failed');
          }

          const data = await response.json();
          setResults(data.user || []);
          setShowDropdown(true);
        }

        // Call external search handler if provided
        if (onSearch) {
          onSearch(debouncedQuery);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchEndpoint, onSearch]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  }, []);

  // Handle clearing search
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setError(null);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [showDropdown, results, selectedIndex]);

  // Handle result click
  const handleResultClick = useCallback((result) => {
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (onResultClick) {
      onResultClick(result);
    }
  }, [onResultClick]);

  // Default result renderer
  const defaultRenderResult = (result, index) => (
    <Link
      key={result._id}
      to={`/profile/${result._id}`}
      onClick={() => handleResultClick(result)}
      className={`
        flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
        ${selectedIndex === index ? 'bg-gray-50 dark:bg-gray-700' : ''}
      `}
      role="option"
      aria-selected={selectedIndex === index}
    >
      <Avatar src={result.pic} name={result.name} size="sm" />
      <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
          {result.name}
        </p>
        {result.email && (
                        <p className="text-xs text-gray-500">
            {result.email}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowDropdown(true)}
          placeholder={placeholder}
          className="
            block w-full pl-12 pr-10 py-3 border border-gray-200 dark:border-gray-700 
            rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800 
            focus:border-primary-500 dark:focus:border-primary-400
            transition-all duration-200
          "
          role="searchbox"
          aria-label={placeholder}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls="search-results"
          autoComplete="off"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
                          <HiX className="h-5 w-5 text-gray-400" />
          </button>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-10 flex items-center">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showDropdown && showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-80 overflow-y-auto"
            id="search-results"
            role="listbox"
            aria-label="Search results"
          >
            {error && (
              <div className="px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && results.length === 0 && query && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No results found for "{query}"
              </div>
            )}

            {!error && results.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  People ({results.length})
                </div>
                {results.map((result, index) => 
                  renderResult ? renderResult(result, index) : defaultRenderResult(result, index)
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OptimizedSearch; 