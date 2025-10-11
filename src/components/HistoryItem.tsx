'use client';

import { useState, memo, lazy, Suspense } from 'react';
import { Clock, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { ConversationHistoryItem } from '@/types';

import CodeBlock from './CodeBlock';

// Lazy load markdown component
const ReactMarkdown = lazy(() => import('react-markdown'));

interface HistoryItemProps {
  conversation: ConversationHistoryItem;
  onDelete?: (id: number) => void;
  onSelect?: (conversation: ConversationHistoryItem) => void;
}

const HistoryItem = memo(({ conversation, onDelete, onSelect }: HistoryItemProps) => {
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
      await onDelete(conversation.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(conversation);
    }
  };

  return (
    <div className="border border-gray-200/50 dark:border-gray-700/50 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-500/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      {/* Clickable main area */}
      <div
        className="p-4 cursor-pointer"
        onClick={handleSelect}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
              <Clock className="w-4 h-4" />
              <span>{formatDate(conversation.created_at)}</span>
              {conversation.model && (
                <span className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  {conversation.model}
                </span>
              )}
              {conversation.type && (
                <span className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                  {conversation.type}
                </span>
              )}
            </div>
            
            <div className="mb-2">
              <div className="flex items-start gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <MessageCircle className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {truncateText(conversation.question || conversation.prompt)}
                </span>
              </div>
            </div>

            {conversation.response && (
              <div className="mt-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Response available - click to load
                  </span>
                </div>

                {/* Preview/expand functionality */}
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide preview
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show preview
                      </>
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 animate-in slide-in-from-top-2 fade-in-0 duration-200">
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
                            {conversation.response}
                          </ReactMarkdown>
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {conversation.state !== 'done' && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                Status: {conversation.state}
              </div>
            )}
          </div>

          {/* Delete button - prevent event propagation */}
          <div className="flex items-center gap-2 ml-4">
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(e);
                }}
                disabled={isDeleting}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete conversation"
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

export default HistoryItem;