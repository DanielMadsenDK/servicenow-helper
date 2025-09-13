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
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* Clickable main area */}
      <div 
        className="p-4 cursor-pointer"
        onClick={handleSelect}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span>{formatDate(conversation.created_at)}</span>
              {conversation.model && (
                <span className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                  {conversation.model}
                </span>
              )}
              {conversation.type && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs capitalize">
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
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Response available - click to load</span>
                </div>
                
                {/* Preview/expand functionality */}
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
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
              <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded">
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
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
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