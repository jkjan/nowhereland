'use client';

import { FixedTags } from '@/widgets/fixed-tags';
import { Post } from '@/entities/post';
import { FixedHeader, ScrollablePostList } from './components';

interface HomeLayoutProps {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSearch: (query: string) => void;
  onTagClick: (tag: string) => void;
  selectedTags: string[];
  searchQuery: string;
}

export default function HomeLayout({
  posts,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onSearch,
  onTagClick,
  selectedTags,
  searchQuery
}: HomeLayoutProps) {
  return (
    <div 
      className="h-full max-w-7xl mx-auto"
      style={{ 
        padding: `var(--spacing-margin)` 
      }}
    >
      <div 
        className="h-full grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12"
        style={{ 
          gap: `var(--spacing-gutter)` 
        }}
      >
        {/* Fixed Tags - Left Sidebar beyond xs (md+) */}
        <div className="hidden md:block lg:col-start-2 md:col-span-1 lg:col-span-1">
          <div 
            className="sticky"
            style={{ 
              top: `var(--spacing-margin)` 
            }}
          >
            <FixedTags 
              onTagClick={onTagClick}
              selectedTags={selectedTags}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-4 md:col-span-7 lg:col-span-9 h-full flex flex-col">
          {/* Fixed Header Area - Search Bar + Tags */}
          <FixedHeader
            onSearch={onSearch}
            onTagClick={onTagClick}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
          />

          {/* Scrollable Post List */}
          <ScrollablePostList
            posts={posts}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
          />
        </div>

        {/* Right Sidebar - Reserved for future use */}
        <div className="hidden lg:block lg:col-span-2">
          {/* Could be used for: recent posts, popular tags, etc. */}
        </div>
      </div>
    </div>
  );
}