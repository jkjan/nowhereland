'use client';

import { useEffect, useRef, useState } from 'react';

interface UsePostListScrollOptions {
  threshold?: number;
}

export function usePostListScroll(options: UsePostListScrollOptions = {}) {
  const { threshold = 10 } = options;
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setIsScrolled(scrollTop > threshold);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return {
    containerRef,
    isScrolled
  };
}