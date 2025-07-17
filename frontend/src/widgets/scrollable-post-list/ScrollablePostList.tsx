'use client';

import { PostList } from '@/widgets/post-list';
import { Post } from '@/entities/post';
import { useState } from 'react';

interface ScrollablePostListProps {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRetry: () => void;
}

export default function ScrollablePostList({
  posts,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry
}: ScrollablePostListProps) {
  const [shadowOpacity, setShadowOpacity] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    // Calculate opacity based on scroll position (0 to 1, maxed at 50px scroll)
    const opacity = Math.min(scrollTop / 50, 1);
    setShadowOpacity(opacity);
  };

  return (
    <div className="relative">
      {/* Shadow when scrolled */}
      <div 
        className="absolute top-0 left-0 right-0 h-4 z-10 pointer-events-none transition-opacity duration-100"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,${0.2 * shadowOpacity}), rgba(0,0,0,${0.1 * shadowOpacity}), transparent)`,
          opacity: shadowOpacity
        }}
      />
      
      <div 
        className="h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden scrollbar-hide"
        onScroll={handleScroll}
      >
        <PostList
          posts={posts}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={onLoadMore}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}