'use client';

import { useState } from 'react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export default function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const t = useTranslations();
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-secondary rounded-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="rounded-xl pl-9 pr-9 h-11 shadow-md border-0 focus:shadow-lg focus:shadow-primary/20 text-secondary-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-0 focus-visible:outline-none"
          />
          {query && (
            <Button
              type="button"
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="text-secondary-foreground absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              title={t('search.clear')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}