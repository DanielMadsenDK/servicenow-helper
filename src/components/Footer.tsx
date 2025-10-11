'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-8 sm:mt-16 text-center">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10">
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          © 2025 Daniel Aagren Seehartrai Madsen.
        </p>
      </div>
    </footer>
  );
}