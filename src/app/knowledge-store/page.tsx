'use client';

import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import KnowledgeStorePanel from '@/components/KnowledgeStorePanel';
import { KnowledgeStoreItem } from '@/types';

export default function KnowledgeStorePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSettings();
  const [selectedItem, setSelectedItem] = useState<KnowledgeStoreItem | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSelectItem = (item: KnowledgeStoreItem) => {
    setSelectedItem(item);
  };

  const handleClosePanel = () => {
    // Navigate back to the main page when closing the knowledge store panel
    router.push('/');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Knowledge Store Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View and manage your knowledge store entries
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Info Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  About the Knowledge Store
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The knowledge store contains Q&A pairs that have been marked as helpful and saved for future reference. 
                  These entries help improve AI responses by providing relevant context and proven solutions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>High-quality Q&A pairs</span>
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Searchable content</span>
                  </div>
                  <div className="flex items-center text-purple-600 dark:text-purple-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span>Usage tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Management Panel */}
          <div className="p-6">
            <KnowledgeStorePanel
              isOpen={true}
              onClose={handleClosePanel}
              onSelectItem={handleSelectItem}
            />
          </div>
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Selected Item Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                    {selectedItem.question}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Answer
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{selectedItem.answer}</pre>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Category</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedItem.category || 'General'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Usage Count</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedItem.usage_count}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Quality Score</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedItem.quality_score.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Created</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedItem.created_at.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div>
                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}