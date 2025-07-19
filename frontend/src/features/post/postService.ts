import { Post } from '@/entities/post/model';
import { mockPosts, generateMorePosts } from '@/shared/mock/post.mock';

export interface PostSearchParams {
  query?: string;
  tags?: string[];
  cursor?: string | null;
  limit?: number;
}

export interface PostListResponse {
  posts: Post[];
  cursor: string | null;
  hasMore: boolean;
}

export class PostService {
  private static instance: PostService;
  private posts: Post[] = mockPosts;

  static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  async searchPosts(params: PostSearchParams): Promise<PostListResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const { query, tags, cursor, limit = 10 } = params;
    let filteredPosts = this.posts;

    // Apply search filter
    if (query && query.trim() !== '') {
      filteredPosts = filteredPosts.filter(post =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.abstract.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Apply tag filter
    if (tags && tags.length > 0) {
      filteredPosts = filteredPosts.filter(post =>
        tags.some(tag => post.tags.includes(tag))
      );
    }

    // Simulate pagination
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const resultPosts = filteredPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredPosts.length;
    const nextCursor = hasMore ? endIndex.toString() : null;

    return {
      posts: resultPosts,
      cursor: nextCursor,
      hasMore,
    };
  }

  async loadMorePosts(currentLength: number): Promise<PostListResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const morePosts = generateMorePosts(currentLength);
    
    return {
      posts: morePosts,
      cursor: `cursor-${Date.now()}`,
      hasMore: currentLength < 10, // Simulate end of data after 10 posts
    };
  }

  async getPostById(id: string): Promise<Post | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return this.posts.find(post => post.id === id) || null;
  }
}