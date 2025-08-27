import { useTranslations } from 'next-intl';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
}

export function ErrorFallback({ error, resetError, message }: ErrorFallbackProps) {
  const t = useTranslations("error");
  
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">
          {message || t('general')}
        </h2>
        <p className="text-gray-600 mb-4">
          {error?.message || t('unexpected')}
        </p>
        {resetError && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('tryAgain')}
          </button>
        )}
      </div>
    </div>
  );
}

export function PostListErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const t = useTranslations("error");
  
  return (
    <div className="flex items-center justify-center min-h-[300px] p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">
          {t('postsLoadFailed')}
        </h2>
        <p className="text-gray-600 mb-4">
          {error?.message || t('unableToLoadPosts')}
        </p>
        {resetError && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('retry')}
          </button>
        )}
      </div>
    </div>
  );
}