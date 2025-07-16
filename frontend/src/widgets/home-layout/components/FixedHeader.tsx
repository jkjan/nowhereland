'use client';

import { SearchBar } from '@/widgets/search-bar';
import { FixedTags } from '@/widgets/fixed-tags';

interface FixedHeaderProps {
  onSearch: (query: string) => void;
  onTagClick: (tag: string) => void;
  selectedTags: string[];
  searchQuery: string;
}

export function FixedHeader({
  onSearch,
  onTagClick,
  selectedTags,
  searchQuery
}: FixedHeaderProps) {
  return (
    <div className="bg-primary/95 backdrop-blur-sm z-10 pb-6 mb-6 flex-shrink-0">
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar 
          onSearch={onSearch}
          initialValue={searchQuery}
        />
      </div>

      {/* Fixed Tags - Mobile Horizontal (xs only) */}
      <div className="md:hidden xs: mt-6">
        <FixedTags 
          onTagClick={onTagClick}
          selectedTags={selectedTags}
        />
      </div>
    </div>
  );
}