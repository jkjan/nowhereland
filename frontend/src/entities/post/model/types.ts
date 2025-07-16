export interface Post {
  id: string;
  title: string;
  abstract: string;
  thumbnail?: string;
  published_at: string;
  view_count: number;
  tags: string[];
}

export interface PostListState {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  cursor: string | null;
}