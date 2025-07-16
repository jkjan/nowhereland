'use client';

import { useEffect, useState } from 'react';

interface UseScrollShadowOptions {
  threshold?: number; // Scroll distance in pixels to trigger shadow
}

export function useScrollShadow(options: UseScrollShadowOptions = {}) {
  const { threshold = 10 } = options;
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setHasScrolled(scrollTop > threshold);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return hasScrolled;
}