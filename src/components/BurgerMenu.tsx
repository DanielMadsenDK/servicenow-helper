'use client';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, BookOpen, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open menu"
        className="flex flex-col items-center justify-center w-10 h-10 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:scale-110 active:scale-95 hover:shadow-md"
      >
        <div className="space-y-1">
          <div className={`w-5 h-0.5 bg-current transition-transform duration-200 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-current transition-opacity duration-200 ${isOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-current transition-transform duration-200 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-in slide-in-from-top-2 fade-in-0 duration-200"
          role="menu"
          aria-label="User menu"
          onKeyDown={handleKeyDown}
        >
          <button
            onClick={() => {
              router.push('/settings');
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/settings');
                setIsOpen(false);
              }
            }}
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/30 rounded-lg mx-1"
            role="menuitem"
          >
            <Settings className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button
            onClick={() => {
              router.push('/knowledge-store');
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/knowledge-store');
                setIsOpen(false);
              }
            }}
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-200 focus:outline-none focus:bg-purple-50 dark:focus:bg-purple-900/30 rounded-lg mx-1"
            role="menuitem"
          >
            <Database className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">Knowledge Store</span>
          </button>
          <button
            onClick={() => {
              router.push('/manual');
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push('/manual');
                setIsOpen(false);
              }
            }}
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 focus:outline-none focus:bg-green-50 dark:focus:bg-green-900/30 rounded-lg mx-1"
            role="menuitem"
          >
            <BookOpen className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">User Manual</span>
          </button>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
          <button
            onClick={async () => {
              await logout();
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                logout();
                setIsOpen(false);
              }
            }}
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/30 rounded-lg mx-1"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}