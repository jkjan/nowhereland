'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string; // Root margin for intersection observer
}

interface UseInfiniteScrollReturn {
  loadMoreRef: React.RefObject<HTMLDivElement>;
  isIntersecting: boolean;
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  loading: boolean,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 100, rootMargin = '0px' } = options;
  const loadMoreRef = useRef<HTMLDivElement>(null!);
  const isIntersectingRef = useRef(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      isIntersectingRef.current = entry.isIntersecting;

      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin,
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleIntersection, rootMargin]);

  // Alternative scroll-based approach as fallback
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < threshold && hasMore && !loading && !isIntersectingRef.current) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, loading, threshold]);

  return {
    loadMoreRef,
    isIntersecting: isIntersectingRef.current,
  };
}