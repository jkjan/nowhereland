'use client';

import { useState } from 'react';
import { SearchBar } from '@/widgets/search-bar';
import { PostList } from '@/widgets/post-list';
import { FixedTags } from '@/widgets/fixed-tags';

// Mock data for development - 10 posts initially
const mockPosts = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  title: `블로그 포스트 ${i + 1}`,
  abstract: `이것은 ${i + 1}번째 블로그 포스트의 요약입니다. 여기에는 포스트의 주요 내용이 간략하게 소개됩니다.`,
  published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  view_count: Math.floor(Math.random() * 500) + 50,
  tags: ['개발', '블로그', 'Next.js', 'React', 'TypeScript'].slice(0, Math.floor(Math.random() * 3) + 1),
}));

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState(mockPosts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [, setCursor] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (query.trim() === '') {
        setPosts(mockPosts);
      } else {
        const filteredPosts = mockPosts.filter(post =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.abstract.toLowerCase().includes(query.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        setPosts(filteredPosts);
      }
      setLoading(false);
    }, 800);
  };

  const handleTagClick = (tag: string) => {
    let newSelectedTags;
    if (selectedTags.includes(tag)) {
      newSelectedTags = selectedTags.filter(t => t !== tag);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }
    setSelectedTags(newSelectedTags);
    
    // Add tag to search query
    const tagQuery = newSelectedTags.map(t => `#${t}`).join(' ');
    setSearchQuery(tagQuery);
    handleSearch(tagQuery);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    
    // Simulate API call with cursor
    setTimeout(() => {
      const morePosts = [
        {
          id: `more-${Date.now()}`,
          title: '더 많은 포스트 ' + (posts.length + 1),
          abstract: '무한 스크롤로 로드된 추가 포스트입니다.',
          published_at: new Date().toISOString(),
          view_count: Math.floor(Math.random() * 100),
          tags: ['추가', '무한스크롤'],
        },
        {
          id: `more-${Date.now() + 1}`,
          title: '또 다른 포스트 ' + (posts.length + 2),
          abstract: '계속해서 로드되는 포스트입니다.',
          published_at: new Date().toISOString(),
          view_count: Math.floor(Math.random() * 100),
          tags: ['더보기', '스크롤'],
        }
      ];
      
      setPosts(prev => [...prev, ...morePosts]);
      setCursor(`cursor-${Date.now()}`);
      setLoadingMore(false);
      
      // Simulate end of data after 10 posts
      if (posts.length >= 10) {
        setHasMore(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-5 lg:px-6 py-8">
      <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-4 lg:gap-6">
        {/* Fixed Tags - Left Sidebar beyond xs (md+), width span 2 */}
        <div className="hidden md:block lg:col-start-2 md:col-span-1 lg:col-span-1 sticky top-24 self-start">
          <FixedTags 
            onTagClick={handleTagClick}
            selectedTags={selectedTags}
          />
        </div>

        {/* Main Content Area */}
        <div className="col-span-4 md:col-span-7 lg:col-span-9">
          {/* Search Bar - sticky under header */}
          <div className="sticky top-16 z-50 bg-background/95 backdrop-blur-sm py-4 mb-6 -mt-8 pt-8">
            <SearchBar 
              onSearch={handleSearch}
              initialValue={searchQuery}
            />
          </div>

          {/* Fixed Tags - Mobile Horizontal (xs only) */}
          <div className="md:hidden mb-6">
            <FixedTags 
              onTagClick={handleTagClick}
              selectedTags={selectedTags}
            />
          </div>

          {/* Post List at bottom of search bar - ui.md: width span 8 for lg, 6 for md, 4 for xs */}
          <PostList
            posts={posts}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
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