'use client';

import { HomeLayout } from '@/widgets/home-layout';
import { useHomePageState } from '@/features/home';

export default function Home() {
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
    <HomeLayout
      posts={posts}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      error={error}
      onLoadMore={handleLoadMore}
      onSearch={handleSearch}
      onTagClick={handleTagClick}
      onRetry={resetError}
      selectedTags={selectedTags}
      searchQuery={searchQuery}
    />
  );
}