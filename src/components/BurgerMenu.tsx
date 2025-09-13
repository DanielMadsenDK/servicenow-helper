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
        className="flex flex-col items-center justify-center w-10 h-10 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
      >
        <div className="space-y-1">
          <div className={`w-5 h-0.5 bg-current transition-transform duration-200 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-current transition-opacity duration-200 ${isOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-current transition-transform duration-200 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50"
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
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
            role="menuitem"
          >
            <Settings className="w-4 h-4 mr-3" />
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
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
            role="menuitem"
          >
            <Database className="w-4 h-4 mr-3" />
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
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
            role="menuitem"
          >
            <BookOpen className="w-4 h-4 mr-3" />
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
            className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/30"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}