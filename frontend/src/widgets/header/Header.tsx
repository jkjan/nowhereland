'use client';

import Link from 'next/link';
import { useTranslation } from '@/shared/lib/i18n';
import { useTheme } from '@/shared/lib/theme';
import SunIcon from '@/shared/ui/sunicon';
import MoonIcon from '@/shared/ui/moonicon';

export default function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full bg-background/95 backdrop-blur-md sticky top-0 z-[9999] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-5 lg:px-6">
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-4 lg:gap-6 items-center h-16">
          {/* Logo - span 2 according to ui.md */}
          <div className="col-span-2">
            <Link 
              href="/" 
              className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200 hover:-translate-y-0.5 transition-all"
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
                <SunIcon/>
              ) : (
                <MoonIcon/>
              )}
            </button>

            {/* About Me / Admin */}
            <Link
              href="/about-me"
              className="md:flex p-2 rounded-theme text-card-foreground hover:-translate-y-0.5 transition-all duration-200"
            >
              {t('navigation.aboutMe')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}