'use client';

import { useState } from 'react';
import SearchBar from '@/components/home/SearchBar';
import PostList from '@/components/home/PostList';
import FixedTags from '@/components/home/FixedTags';
import { useTranslation } from '@/lib/i18n';

// Mock data for development
const mockPosts = [
  {
    id: '1',
    title: '첫 번째 블로그 포스트',
    abstract: '이것은 첫 번째 블로그 포스트의 요약입니다. 여기에는 포스트의 주요 내용이 간략하게 소개됩니다.',
    published_at: '2024-01-15T10:00:00Z',
    view_count: 142,
    tags: ['개발', '블로그', 'Next.js'],
  },
  {
    id: '2',
    title: 'React 18의 새로운 기능들',
    abstract: 'React 18에서 도입된 Concurrent Features와 Suspense의 개선사항에 대해 알아봅시다.',
    published_at: '2024-01-10T14:30:00Z',
    view_count: 256,
    tags: ['React', '개발', '프론트엔드'],
  },
  {
    id: '3',
    title: 'TypeScript로 더 안전한 코드 작성하기',
    abstract: 'TypeScript의 고급 기능을 활용하여 타입 안전성을 높이고 개발 생산성을 향상시키는 방법을 소개합니다.',
    published_at: '2024-01-05T09:15:00Z',
    view_count: 189,
    tags: ['TypeScript', '개발', '코드품질'],
  },
];

export default function Home() {
  // const { t } = useTranslation(); // Will be used when implementing search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState(mockPosts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-6">
        {/* Fixed Tags - Desktop Left Sidebar */}
        <div className="hidden lg:block lg:col-span-2 lg:sticky lg:top-24 lg:self-start">
          <FixedTags 
            onTagClick={handleTagClick}
            selectedTags={selectedTags}
          />
        </div>

        {/* Main Content */}
        <div className="col-span-4 lg:col-span-8">
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar 
              onSearch={handleSearch}
              initialValue={searchQuery}
            />
          </div>

          {/* Fixed Tags - Mobile Horizontal */}
          <div className="lg:hidden mb-6">
            <FixedTags 
              onTagClick={handleTagClick}
              selectedTags={selectedTags}
            />
          </div>

          {/* Post List */}
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