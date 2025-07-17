export interface Post {
  id: string;
  title: string;
  abstract: string;
  thumbnail?: string;
  published_at: string;
  view_count: number;
  tags: string[];
}