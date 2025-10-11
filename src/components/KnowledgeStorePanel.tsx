'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Database, Search, X, Filter, RefreshCw, AlertCircle, Trash2, CheckSquare, Square } from 'lucide-react';

import { KnowledgeStoreItem, KnowledgeStoreQueryResult, KnowledgeStoreFilters } from '@/types';

import KnowledgeStoreItemComponent from './KnowledgeStoreItem';

interface KnowledgeStorePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: (item: KnowledgeStoreItem) => void;
}

export default function KnowledgeStorePanel({ isOpen, onClose, onSelectItem }: KnowledgeStorePanelProps) {
  const [items, setItems] = useState<KnowledgeStoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<KnowledgeStoreFilters>({
    search: '',
    category: '',
    dateRange: { start: null, end: null },
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pagination constants
  const ITEMS_PER_PAGE = 20;

  const fetchItems = useCallback(async (page: number = 1, reset: boolean = true) => {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: offset.toString(),
      });

      // Add search filter
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      // Add category filter
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }

      const response = await fetch(`/api/knowledge-store?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch knowledge store items');
      }

      if (data.success && data.data) {
        const result: KnowledgeStoreQueryResult = data.data;
        // Convert string dates to Date objects
        const itemsWithDates = result.items.map(item => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at)
        }));
        
        if (reset) {
          setItems(itemsWithDates);
          setCurrentPage(page);
        } else {
          // Append to existing items for pagination
          setItems(prev => [...prev, ...itemsWithDates]);
          setCurrentPage(page);
        }
        
        setTotal(result.total);
        setHasMore(result.hasMore);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch knowledge store items');
    } finally {
      setLoading(false);
    }
  }, [filters, ITEMS_PER_PAGE]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);
  }, []);

  const handleDeleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/knowledge-store/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete knowledge store item');
      }

      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      
      // Remove from selection if it was selected
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(id);
        return newSelection;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete knowledge store item');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    setBulkDeleting(true);
    try {
      const response = await fetch('/api/knowledge-store', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete knowledge store items');
      }

      // Remove from local state
      setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
      setTotal(prev => prev - selectedItems.size);
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete knowledge store items');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    fetchItems(1, true);
  }, [fetchItems]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchItems(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, fetchItems]);

  const handleSelectionChange = useCallback((id: number, selected: boolean) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [selectedItems.size, items]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      dateRange: { start: null, end: null },
    });
    setSearchInput('');
    setCurrentPage(1);
  }, []);

  // Load items when filters change
  useEffect(() => {
    if (isOpen) {
      fetchItems(1, true);
    }
  }, [isOpen, filters, fetchItems]);

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

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedItems.size > 0);
  }, [selectedItems.size]);

  // Memoize expensive computations - must be before early return
  const allSelected = useMemo(() => {
    return selectedItems.size === items.length && items.length > 0;
  }, [selectedItems.size, items.length]);

  const filteredAndSortedItems = useMemo(() => {
    // Since we now do server-side filtering, items are already filtered
    // But we can still add client-side sorting if needed in the future
    return items.sort((a, b) => {
      // Sort by updated_at descending (most recent first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [items]);

  const displayItems = useMemo(() => {
    return filteredAndSortedItems;
  }, [filteredAndSortedItems]);

  // Memoize selection state for each item to avoid unnecessary re-renders
  const itemSelectionStates = useMemo(() => {
    const states = new Map<number, boolean>();
    displayItems.forEach(item => {
      states.set(item.id, selectedItems.has(item.id));
    });
    return states;
  }, [displayItems, selectedItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 backdrop-blur-md bg-gray-900/20 dark:bg-black/40 transition-all duration-300 animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10 animate-in slide-in-from-right-full duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Knowledge Store</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  {total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg ${
                    showFilters
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 group-focus-within:scale-110 transition-all" />
              <input
                type="text"
                placeholder="Search questions and answers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all duration-200 shadow-sm hover:border-gray-300 dark:hover:border-gray-500"
              />
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 px-2.5 py-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-all duration-200"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                      {selectedItems.size} selected
                    </span>
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="flex items-center gap-1.5 min-h-[36px] px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {bulkDeleting ? (
                      <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 px-2 py-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-all duration-200"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded px-2 py-1"
                    >
                      <option value="">All categories</option>
                      <option value="general">General</option>
                      <option value="scripting">Scripting</option>
                      <option value="configuration">Configuration</option>
                      <option value="troubleshooting">Troubleshooting</option>
                    </select>
                  </div>
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

            {items.length === 0 && !loading && !error && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No knowledge store items found</p>
                {filters.search && (
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                )}
              </div>
            )}

            <div className="p-4 space-y-4">
              {displayItems.map((item) => (
                <KnowledgeStoreItemComponent
                  key={item.id}
                  item={item}
                  onDelete={handleDeleteItem}
                  onSelect={onSelectItem}
                  isSelected={itemSelectionStates.get(item.id) || false}
                  onSelectionChange={handleSelectionChange}
                  showSelection={true}
                />
              ))}
            </div>

            {loading && (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading knowledge store items...</p>
              </div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && items.length > 0 && (
              <div className="p-4 text-center border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={handleLoadMore}
                  className="min-h-[44px] px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}