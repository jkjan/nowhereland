'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseGlobalScrollOptions {
  enabled?: boolean;
}

/**
 * Hook that captures wheel events anywhere on the page and forwards them to a specific container
 * This allows scrolling the post list from anywhere on the page
 */
export function useGlobalScroll(options: UseGlobalScrollOptions = {}) {
  const { enabled = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  const setContainer = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Prevent default page scroll
      e.preventDefault();

      // Forward the scroll to the container
      container.scrollTop += e.deltaY;
    };

    // Add wheel event listener to the document
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [enabled]);

  return setContainer;
}