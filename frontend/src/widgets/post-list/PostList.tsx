'use client';

import { useTranslation } from '@/lib/i18n';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card } from '@/shared/ui/card';
import { useInfiniteScroll } from '@/shared/hooks';
import { PostItem } from '../post-item';

interface Post {
  id: string;
  title: string;
  abstract: string;
  thumbnail?: string;
  published_at: string;
  view_count: number;
  tags: string[];
}

interface PostListProps {
  posts?: Post[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function PostSkeleton() {
  return (
    <Card className="p-4 mb-4 shadow-md border-0 bg-white text-black">
      <div className="flex gap-4">
        {/* Thumbnail skeleton */}
        <div className="flex-shrink-0">
          <Skeleton className="w-24 h-24 lg:w-32 lg:h-32 rounded-md" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PostList({ 
  posts = [], 
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore
}: PostListProps) {
  const { t } = useTranslation();
  
  const { loadMoreRef } = useInfiniteScroll(
    onLoadMore || (() => {}),
    hasMore,
    loadingMore
  );

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
    <div>
      {/* Posts */}
      <div>
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center mt-8 py-4">
          {loadingMore && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="text-muted-foreground">{t('loading.posts')}</span>
            </div>
          )}
        </div>
      )}

      {/* No more posts message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 mt-8">
          <p className="text-muted-foreground text-sm">{t('posts.noMorePosts')}</p>
        </div>
      )}

      {/* Loading more skeletons */}
      {loadingMore && (
        <div className="mt-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <PostSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  );
}