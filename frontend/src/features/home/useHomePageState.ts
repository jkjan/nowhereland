'use client';

import { useState } from 'react';

interface Post {
  id: string;
  title: string;
  abstract: string;
  thumbnail?: string;
  published_at: string;
  view_count: number;
  tags: string[];
}

// Mock data for development - 10 posts initially
const mockPosts: Post[] = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  title: `블로그 포스트 ${i + 1}`,
  abstract: `이것은 ${i + 1}번째 블로그 포스트의 요약입니다. 여기에는 포스트의 주요 내용이 간략하게 소개됩니다.`,
  published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  view_count: Math.floor(Math.random() * 500) + 50,
  tags: ['개발', '블로그', 'Next.js', 'React', 'TypeScript'].slice(0, Math.floor(Math.random() * 3) + 1),
}));

export function useHomePageState() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
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

  return {
    searchQuery,
    selectedTags,
    posts,
    loading,
    loadingMore,
    hasMore,
    handleSearch,
    handleTagClick,
    handleLoadMore,
  };
}