'use client';

import React from 'react';
import { ArrowLeft, BookOpen, Search, Settings as SettingsIcon, MessageSquare, Lightbulb, FileText, Code2, Wrench, Eye, Globe, ToggleRight, Clock, List, BookmarkPlus, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BurgerMenu from './BurgerMenu';
import ThemeToggle from './ThemeToggle';
import StepGuide from './StepGuide';

export default function UserManual() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        {/* Light theme pattern */}
        <div className="absolute inset-0 opacity-30 dark:hidden" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #64748b 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #64748b 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0, 25px 25px'
        }}></div>
        
        {/* Dark theme pattern */}
        <div className="absolute inset-0 opacity-15 hidden dark:block" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #e0e7ff 0.8px, transparent 0.8px),
                           radial-gradient(circle at 75% 75%, #f0f9ff 0.8px, transparent 0.8px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0, 25px 25px'
        }}></div>
      </div>

      {/* Header Bar */}
      <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <BookOpen className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                User Manual
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <BurgerMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6 md:p-8">
          <div className="space-y-8">
            
            {/* Welcome Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-blue-500" />
                Welcome to ServiceNow Helper
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                Your AI-powered assistant for ServiceNow support and guidance. Ask questions, get documentation, 
                request scripts, and troubleshoot issues with intelligent, contextual responses.
              </p>
            </div>

            {/* Getting Started */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <Search className="w-5 h-5 mr-3 text-green-500" />
                Getting Started
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Basic Usage</h3>
                <StepGuide 
                  steps={[
                    "Type your ServiceNow question in the main text area",
                    "Select a request type (Recommendation, Documentation, Script, or Troubleshoot)",
                    "Click 'Get Help' or press Ctrl+Enter to submit",
                    "Review the AI-generated response with actionable guidance"
                  ]}
                  type="instruction"
                />
              </div>
            </div>

            {/* Request Types */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Request Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center mb-3">
                    <Lightbulb className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">Recommendation</h3>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Get best practice suggestions, implementation advice, and strategic guidance for ServiceNow configurations.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center mb-3">
                    <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Documentation</h3>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Access detailed explanations, step-by-step guides, and reference materials for ServiceNow features.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center mb-3">
                    <Code2 className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Script</h3>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Generate custom scripts, business rules, client scripts, and other ServiceNow code snippets.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center mb-3">
                    <Wrench className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Troubleshoot</h3>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Diagnose issues, debug problems, and get solutions for ServiceNow configuration challenges.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Key Features</h2>
              <div className="space-y-4">
                
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                  <Search className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Search Mode</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enhanced search capabilities that help find relevant information from ServiceNow documentation and knowledge base.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                  <Clock className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Conversation History</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access your previous questions and responses through the history panel for easy reference and follow-up. You can also add valuable Q&A pairs from your history to the knowledge base.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                  <Globe className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">ServiceNow Integration</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure your ServiceNow instance URL in settings to get direct links and instance-specific guidance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                  <Database className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Knowledge Base</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add helpful Q&A pairs to the knowledge base to improve future responses. The AI automatically uses this knowledge base when generating answers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Base */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <BookmarkPlus className="w-5 h-5 mr-3 text-indigo-500" />
                Knowledge Base
              </h2>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-6">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Automatic Knowledge Base Usage</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        When you ask a question, the AI automatically searches the knowledge base to find relevant Q&A pairs that can help improve the response.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Adding to Knowledge Base</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        After receiving a helpful response (or when viewing conversation history), you&apos;ll see an &quot;Add to knowledge base&quot; button. Click it to save the Q&A pair for future reference.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Improving Future Responses</h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        The saved Q&A pairs help the AI provide more accurate and contextual responses to similar questions in the future.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white dark:bg-indigo-800/30 rounded-lg border border-indigo-300 dark:border-indigo-600">
                  <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2 flex items-center">
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Best Practices
                  </h4>
                  <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                    <li>• Add Q&A pairs that contain valuable, reusable information</li>
                    <li>• Include responses with specific technical details or code examples</li>
                    <li>• Save troubleshooting solutions that could help others</li>
                    <li>• Add comprehensive configuration guides and best practices</li>
                    <li>• Review conversation history to find valuable Q&A pairs worth saving</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Settings Guide */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <SettingsIcon className="w-5 h-5 mr-3 text-gray-500" />
                Customizing Your Experience
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Settings Overview</h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start space-x-3">
                    <Eye className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Welcome Section:</strong> Show or hide the welcome information panel</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Instance URL:</strong> Set your ServiceNow instance for direct links</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ToggleRight className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Default Search Mode:</strong> Set preferred Search Mode default</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <List className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Request Type:</strong> Choose your default request type for new sessions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips & Best Practices */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Tips & Best Practices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Do</h3>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• Be specific about your ServiceNow version</li>
                    <li>• Include table names and field details</li>
                    <li>• Mention your role and access level</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">❌ Avoid</h3>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    <li>• Vague or overly broad questions</li>
                    <li>• Including sensitive data or passwords</li>
                    <li>• Asking about unsupported customizations</li>
                    <li>• Multiple unrelated questions at once</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Keyboard Shortcuts</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Submit question</span>
                      <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">Ctrl + Enter</kbd>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Close modals</span>
                      <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">Escape</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}