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
      onLoadMore={handleLoadMore}
      onSearch={handleSearch}
      onTagClick={handleTagClick}
      selectedTags={selectedTags}
      searchQuery={searchQuery}
    />
  );
}