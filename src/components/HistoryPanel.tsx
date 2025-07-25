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

  const fetchConversations = useCallback(async (reset = false, pageOverride?: number) => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const page = pageOverride !== undefined ? pageOverride : currentPage;
      const offset = reset ? 0 : page * ITEMS_PER_PAGE;
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
  }, [filters, currentPage]);

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

  // Load conversations when filters change
  useEffect(() => {
    if (isOpen) {
      fetchConversations(true);
    }
  }, [isOpen, filters, fetchConversations]);

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
        className="fixed inset-0 backdrop-blur-sm bg-gray-900/10 dark:bg-black/20 transition-all duration-200"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">History</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({total})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Filters"
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
                  className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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