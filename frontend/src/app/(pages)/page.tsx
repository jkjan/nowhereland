'use client';

import { FixedTags } from '@/widgets/fixed-tags';
import { FixedHeader } from '../../widgets/fixed-header';
import { useHomePageState } from '@/features/home';
import { ScrollablePostList } from '@/widgets/scrollable-post-list';

export default function HomeLayout() {
    const {
      searchQuery,
      selectedTags,
      posts,
      loading,
      loadingMore,
      hasMore,
      error,
      resetError,
      handleSearch,
      handleTagClick,
      handleLoadMore,
    } = useHomePageState();

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
              onTagClick={handleTagClick}
              selectedTags={selectedTags}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-4 md:col-span-7 lg:col-span-9 h-full flex flex-col">
          {/* Fixed Header Area - Search Bar + Tags */}
          <FixedHeader
            onSearch={handleSearch}
            onTagClick={handleTagClick}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
          />

          {/* Scrollable Post List */}
          <ScrollablePostList
            posts={posts}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={handleLoadMore}
            onRetry={resetError}
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