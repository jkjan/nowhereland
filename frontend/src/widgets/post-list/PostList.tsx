'use client';

import { useTranslation } from '@/lib/i18n';
import { useInfiniteScroll } from '@/shared/hooks';
import { PostItem } from '../post-item';
import { Post } from '@/entities/post';
import { PostListErrorFallback } from '@/shared/ui/error-fallback';
import { PostSkeleton } from '../post-skeleton';

interface PostListProps {
  posts?: Post[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  onRetry?: () => void;
}

export default function PostList({ 
  posts = [], 
  loading = false,
  loadingMore = false,
  hasMore = false,
  error = null,
  onLoadMore,
  onRetry
}: PostListProps) {
  const { t } = useTranslation();
  
  const { loadMoreRef } = useInfiniteScroll(
    onLoadMore || (() => {}),
    hasMore,
    loadingMore
  );

  // Show error state
  if (error && posts.length === 0) {
    const translatedError = t(`error.${error}`);
    return <PostListErrorFallback error={new Error(translatedError)} resetError={onRetry} />;
  }

  if (loading && posts.length === 0) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral text-lg">{t('search.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="my-1 mx-0.5">
      {/* Posts and loading skeletons in one continuous list */}
      <div>
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
        
        {/* Loading more skeletons - no gap */}
        {loadingMore && (
          <>
            {Array.from({ length: 2 }).map((_, index) => (
              <PostSkeleton key={`loading-${index}`} />
            ))}
          </>
        )}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="mt-8 py-4" />
      )}

      {/* No more posts message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 mt-8">
          <p className="text-muted-foreground text-sm">{t('posts.noMorePosts')}</p>
        </div>
      )}
    </div>
  );
}