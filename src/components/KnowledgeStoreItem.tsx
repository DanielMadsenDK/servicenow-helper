'use client';

import { useState, memo, lazy, Suspense } from 'react';
import { Clock, MessageCircle, Trash2, ChevronDown, ChevronUp, Tag, TrendingUp, Star } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { KnowledgeStoreItem } from '@/types';

import CodeBlock from './CodeBlock';

// Lazy load markdown component
const ReactMarkdown = lazy(() => import('react-markdown'));

interface KnowledgeStoreItemProps {
  item: KnowledgeStoreItem;
  onDelete?: (id: number) => void;
  onSelect?: (item: KnowledgeStoreItem) => void;
  isSelected?: boolean;
  onSelectionChange?: (id: number, selected: boolean) => void;
  showSelection?: boolean;
}

const KnowledgeStoreItemComponent = memo(({ 
  item, 
  onDelete, 
  onSelect, 
  isSelected = false,
  onSelectionChange,
  showSelection = false
}: KnowledgeStoreItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(item.id, e.target.checked);
    }
  };

  return (
    <div className="border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-purple-500/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      {/* Clickable main area */}
      <div
        className="p-4 cursor-pointer"
        onClick={handleSelect}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Selection checkbox */}
            {showSelection && (
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleSelectionChange}
                  className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-600 text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
                <Clock className="w-4 h-4" />
                <span>{formatDate(item.created_at)}</span>

                {item.category && (
                  <span className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {item.category}
                  </span>
                )}

                {item.usage_count > 0 && (
                  <span className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    Used {item.usage_count}x
                  </span>
                )}

                {item.quality_score > 0 && (
                  <span className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3" />
                    {item.quality_score.toFixed(1)}
                  </span>
                )}
              </div>
              
              <div className="mb-2">
                <div className="flex items-start gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <MessageCircle className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.question}
                  </span>
                </div>
              </div>

              {item.answer && (
                <div className="mt-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Answer:</span> {truncateText(item.answer, 100)}
                  </div>

                  {/* Preview/expand functionality */}
                  <div className="mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-all duration-200 px-2.5 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide answer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show full answer
                        </>
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-600/50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <Suspense fallback={
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                          }>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                code: ({ className, children, ...props }) => {
                                  return (
                                    <CodeBlock
                                      className={className}
                                      {...props}
                                    >
                                      {children}
                                    </CodeBlock>
                                  );
                                }
                              }}
                            >
                              {item.answer}
                            </ReactMarkdown>
                          </Suspense>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delete button - prevent event propagation */}
          <div className="flex items-center gap-2 ml-4">
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete from knowledge store"
              >
                {isDeleting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default KnowledgeStoreItemComponent;