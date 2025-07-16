'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full bg-background/95 backdrop-blur-md shadow-md sticky top-0 z-[9999] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-5 lg:px-6">
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-4 lg:gap-6 items-center h-16">
          {/* Logo - span 2 according to ui.md */}
          <div className="col-span-2">
            <Link 
              href="/" 
              className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200"
            >
              Nowhere Land
            </Link>
          </div>

          {/* Navigation - remaining columns */}
          <div className="col-span-2 md:col-span-6 lg:col-span-10 flex items-center justify-end gap-2">
            {/* Theme Toggle - Visible beyond xs (md+) according to ui.md */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 rounded-theme text-card-foreground hover:-translate-y-0.5 transition-all duration-200"
              title={t('theme.toggle')}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* About Me / Admin */}
            <Link
              href="/about-me"
              className="p-2 rounded-theme text-card-foreground font-medium hover:bg-neutral-200 hover:text-neutral-600 transition-all duration-200"
            >
              {t('navigation.aboutMe')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}