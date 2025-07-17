'use client';

import { useState } from 'react';
import { Post } from '@/entities/post/model';

import { mockPosts, generateMorePosts } from '@/shared/mock/post.mock';

export function useHomePageState() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCursor] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      try {
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
      } catch {
        setError('searchFailed');
        setLoading(false);
      }
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
    setError(null);
    
    // Simulate API call with cursor
    setTimeout(() => {
      try {
        const morePosts = generateMorePosts(posts.length);
        
        setPosts(prev => [...prev, ...morePosts]);
        setCursor(`cursor-${Date.now()}`);
        setLoadingMore(false);
        
        // Simulate end of data after 10 posts
        if (posts.length >= 10) {
          setHasMore(false);
        }
      } catch {
        setError('loadMoreFailed');
        setLoadingMore(false);
      }
    }, 1000);
  };

  const resetError = () => {
    setError(null);
  };

  return {
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
  };
}