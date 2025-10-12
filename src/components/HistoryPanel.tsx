'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { History, Search, X, Filter, RefreshCw, AlertCircle } from 'lucide-react';

import { ConversationHistoryItem, HistoryQueryResult, HistoryFilters } from '@/types';

import HistoryItem from './HistoryItem';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conversation: ConversationHistoryItem) => void;
}

export default function HistoryPanel({ isOpen, onClose, onSelectConversation }: HistoryPanelProps) {
  const [conversations, setConversations] = useState<ConversationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    dateRange: { start: null, end: null },
    showCompleted: true,
    showPending: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);

  const ITEMS_PER_PAGE = 20;

  // Memoize fetchConversations with useCallback to prevent infinite loops
  // Only depends on primitive filter values, not the filters object itself
  const fetchConversations = useCallback(async (reset = false, page?: number) => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const pageToUse = page !== undefined ? page : currentPage;
      const offset = reset ? 0 : pageToUse * ITEMS_PER_PAGE;
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      });

      // Add search filter
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      // Add date filters
      if (filters.dateRange.start) {
        params.append('startDate', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        params.append('endDate', filters.dateRange.end.toISOString());
      }

      // Add state filter
      if (filters.showCompleted !== filters.showPending) {
        // Only one of them is true
        params.append('state', filters.showCompleted ? 'done' : 'processing');
      }
      // If both are true, do not append any state filter (show all)
      // If both are false, also do not append any state filter (show none or let backend handle)

      const response = await fetch(`/api/history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      if (data.success && data.data) {
        const result: HistoryQueryResult = data.data;
        // Convert string dates to Date objects
        const conversationsWithDates = result.conversations.map(conv => ({
          ...conv,
          created_at: new Date(conv.created_at)
        }));

        if (reset) {
          setConversations(conversationsWithDates);
          setCurrentPage(1);
        } else {
          setConversations(prev => [...prev, ...conversationsWithDates]);
          setCurrentPage(prev => prev + 1);
        }
        setHasMore(result.hasMore);
        setTotal(result.total);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [
    currentPage,
    filters.search,
    filters.dateRange.start,
    filters.dateRange.end,
    filters.showCompleted,
    filters.showPending
  ]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setCurrentPage(0);
      setConversations([]);
    }, 300);
  }, []);

  const handleDeleteConversation = async (id: number) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete conversation');
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  const handleRefresh = () => {
    setCurrentPage(0);
    setConversations([]);
    fetchConversations(true);
  };

  const handleLoadMore = () => {
    if (!fetchingRef.current && hasMore) {
      // Pass currentPage explicitly to fetch the next page
      // fetchConversations will increment the page state after successful fetch
      fetchConversations(false, currentPage);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      dateRange: { start: null, end: null },
      showCompleted: true,
      showPending: false,
    });
    setSearchInput('');
    setCurrentPage(0);
    setConversations([]);
  };

  // Load conversations when panel opens or filters change
  // Use a ref to track filter changes and avoid infinite loops
  const prevFiltersRef = useRef(filters);

  useEffect(() => {
    if (isOpen) {
      // Check if filters actually changed (not just object reference)
      const filtersChanged =
        prevFiltersRef.current.search !== filters.search ||
        prevFiltersRef.current.dateRange.start !== filters.dateRange.start ||
        prevFiltersRef.current.dateRange.end !== filters.dateRange.end ||
        prevFiltersRef.current.showCompleted !== filters.showCompleted ||
        prevFiltersRef.current.showPending !== filters.showPending;

      if (filtersChanged) {
        prevFiltersRef.current = filters;
        fetchConversations(true);
      } else if (conversations.length === 0 && !fetchingRef.current) {
        // Initial load when panel opens
        fetchConversations(true);
      }
    }
  }, [isOpen, filters, fetchConversations, conversations.length]);

  // Handle search input changes
  useEffect(() => {
    handleSearch(searchInput);
  }, [searchInput, handleSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 backdrop-blur-md bg-gray-900/20 dark:bg-black/40 transition-all duration-300 animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl shadow-blue-500/10 animate-in slide-in-from-right-full duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">History</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg ${
                    showFilters
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                  title="Filters"
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-3 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 group-focus-within:scale-110 transition-all" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-500"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all duration-200"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showCompleted}
                      onChange={(e) => setFilters(prev => ({ ...prev, showCompleted: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Completed</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showPending}
                      onChange={(e) => setFilters(prev => ({ ...prev, showPending: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Pending</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
              </div>
            )}

            {conversations.length === 0 && !loading && !error && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No conversations found</p>
                {filters.search && (
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                )}
              </div>
            )}

            <div className="p-4 space-y-4">
              {conversations.map((conversation) => (
                <HistoryItem
                  key={conversation.id}
                  conversation={conversation}
                  onDelete={handleDeleteConversation}
                  onSelect={onSelectConversation}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && conversations.length > 0 && (
              <div className="p-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="min-h-[44px] px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {loading && conversations.length === 0 && (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading conversations...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}