'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

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

function PostItem({ post }: { post: Post }) {
  const { t } = useTranslation();
  
  return (
    <Link href={`/post/${post.id}`} className="block group">
      <Card className="p-4 mb-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:-translate-x-0.5 hover:shadow-primary/20 border-0 bg-white text-black">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            {post.thumbnail ? (
              <Image
                src={post.thumbnail}
                alt={post.title}
                width={128}
                height={128}
                className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 object-cover rounded-md shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-secondary shadow-sm rounded-md flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
              {post.title}
            </h2>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm md:text-sm lg:text-base">
              {post.abstract}
            </p>
            
            {/* Metadata */}
            <div className="flex items-center gap-2 md:gap-4 mt-2 text-xs md:text-xs lg:text-sm text-muted-foreground">
              <span>{new Date(post.published_at).toLocaleDateString()}</span>
              <span>{t('post.viewCount', { count: post.view_count })}</span>
            </div>
            
            {/* Tags - accent colored as requested */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-neutral/20 text-neutral rounded-full shadow-sm">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
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

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={onLoadMore}
            disabled={loadingMore}
            variant="default"
            size="lg"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                <span>{t('loading.posts')}</span>
              </div>
            ) : (
              '더 보기'
            )}
          </Button>
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