'use client';

import { SearchBar } from '@/widgets/search-bar';
import { FixedTags } from '@/widgets/fixed-tags';
import { PostList } from '@/widgets/post-list';
import { useScrollShadow } from '@/shared/hooks';

interface Post {
  id: string;
  title: string;
  abstract: string;
  thumbnail?: string;
  published_at: string;
  view_count: number;
  tags: string[];
}

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
  const hasScrolled = useScrollShadow({ threshold: 10 });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-5 lg:px-6 py-8">
      <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-4 lg:gap-6">
        {/* Fixed Tags - Left Sidebar beyond xs (md+) */}
        <div className="hidden md:block lg:col-start-2 md:col-span-1 lg:col-span-1">
          <FixedTags 
            onTagClick={onTagClick}
            selectedTags={selectedTags}
          />
        </div>

        {/* Main Content Area */}
        <div className="col-span-4 md:col-span-7 lg:col-span-9">
          {/* Search Bar - Fixed position with shadow when scrolled */}
          <div className={`mb-6 transition-shadow duration-300 ${hasScrolled ? 'shadow-md' : ''}`}>
            <SearchBar 
              onSearch={onSearch}
              initialValue={searchQuery}
            />
          </div>

          {/* Fixed Tags - Mobile Horizontal (xs only) - Fixed position */}
          <div className="md:hidden mb-6">
            <FixedTags 
              onTagClick={onTagClick}
              selectedTags={selectedTags}
            />
          </div>

          {/* Post List - This is the ONLY scrollable part */}
          <PostList
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