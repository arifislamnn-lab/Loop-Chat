import React, { useState } from 'react';
import { Menu, Headphones, Moon, Sun, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMenu}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            Loop Chat
          </h1>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 w-72 h-[100dvh] bg-white dark:bg-zinc-900 z-50 shadow-xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-white">Menu</span>
                <button
                  onClick={toggleMenu}
                  className="p-2 -mr-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left text-zinc-700 dark:text-zinc-300"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <a
                  href="https://www.facebook.com/mehedi6511"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left text-zinc-700 dark:text-zinc-300"
                >
                  <Headphones className="w-5 h-5" />
                  <span>Support</span>
                </a>
              </div>
              <div className="p-4 mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Disclaimer:</span> Loop Chat is designed for fun and entertainment purposes only. Please be respectful to others and do not share personal information.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
