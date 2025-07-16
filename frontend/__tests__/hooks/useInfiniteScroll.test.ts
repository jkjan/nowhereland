/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('useInfiniteScroll', () => {
  const mockOnLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create loadMoreRef', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockOnLoadMore, true, false)
    );

    expect(result.current.loadMoreRef).toBeDefined();
    expect(result.current.loadMoreRef.current).toBeNull();
  });

  it('should set up IntersectionObserver on mount', () => {
    renderHook(() => useInfiniteScroll(mockOnLoadMore, true, false));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      })
    );
  });

  it('should call onLoadMore when hasMore is true and not loading', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll(mockOnLoadMore, true, false)
    );

    // Simulate intersection
    const [observerCallback] = mockIntersectionObserver.mock.calls[0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });

  it('should not call onLoadMore when hasMore is false', () => {
    renderHook(() => useInfiniteScroll(mockOnLoadMore, false, false));

    const [observerCallback] = mockIntersectionObserver.mock.calls[0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(mockOnLoadMore).not.toHaveBeenCalled();
  });

  it('should not call onLoadMore when loading is true', () => {
    renderHook(() => useInfiniteScroll(mockOnLoadMore, true, true));

    const [observerCallback] = mockIntersectionObserver.mock.calls[0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    expect(mockOnLoadMore).not.toHaveBeenCalled();
  });

  it('should use custom options', () => {
    const customOptions = {
      threshold: 200,
      rootMargin: '10px',
    };

    renderHook(() =>
      useInfiniteScroll(mockOnLoadMore, true, false, customOptions)
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        root: null,
        rootMargin: '10px',
        threshold: 0.1,
      })
    );
  });
});