import { Post } from '@/entities/post/model';

export const mockPosts: Post[] = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  title: `블로그 포스트 ${i + 1}`,
  abstract: `이것은 ${i + 1}번째 블로그 포스트의 요약입니다. 여기에는 포스트의 주요 내용이 간략하게 소개됩니다.`,
  published_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  view_count: Math.floor(Math.random() * 500) + 50,
  tags: ['개발', '블로그', 'Next.js', 'React', 'TypeScript'].slice(0, Math.floor(Math.random() * 3) + 1),
}));

export const generateMorePosts = (currentLength: number): Post[] => [
  {
    id: `more-${Date.now()}`,
    title: '더 많은 포스트 ' + (currentLength + 1),
    abstract: '무한 스크롤로 로드된 추가 포스트입니다.',
    published_at: new Date().toISOString(),
    view_count: Math.floor(Math.random() * 100),
    tags: ['추가', '무한스크롤'],
  },
  {
    id: `more-${Date.now() + 1}`,
    title: '또 다른 포스트 ' + (currentLength + 2),
    abstract: '계속해서 로드되는 포스트입니다.',
    published_at: new Date().toISOString(),
    view_count: Math.floor(Math.random() * 100),
    tags: ['더보기', '스크롤'],
  }
];