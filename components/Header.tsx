import React from 'react';
import { AppLogo, SunIcon, MoonIcon, UserCircleIcon, CreditCardIcon, LogoutIcon } from './IconComponents';

interface HeaderProps {
    theme: 'light' | 'dark';
    onThemeToggle: () => void;
    isLoggedIn: boolean;
    credits: number;
    onLogin: () => void;
    onLogout: () => void;
    onBuyCredits: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, isLoggedIn, credits, onLogin, onLogout, onBuyCredits }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <AppLogo className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Bushyfam's Studio Shot
            </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
              onClick={onThemeToggle}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Toggle theme"
          >
              {theme === 'dark' ? (
                  <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                  <MoonIcon className="w-6 h-6 text-gray-700" />
              )}
          </button>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">{credits} Guthaben</span>
              </div>
              <button 
                onClick={onBuyCredits}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500 text-white font-semibold text-sm hover:bg-green-600"
              >
                <CreditCardIcon className="w-4 h-4" /> Credits kaufen
              </button>
               <button 
                onClick={onLogout}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Logout"
              >
                 <LogoutIcon className="w-6 h-6"/>
              </button>
            </div>
          ) : (
             <button 
              onClick={onLogin}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Anmelden
            </button>
          )}

        </div>
      </div>
    </header>
  );
};