'use client';

import Tag from '@/shared/ui/tag';

interface FixedTagsProps {
  tags?: string[];
  onTagClick?: (tag: string) => void;
  selectedTags?: string[];
}

const defaultTags = ['개발', '개인', '여행', '음식', '책'];

export default function FixedTags({ 
  tags = defaultTags, 
  onTagClick,
  selectedTags = []
}: FixedTagsProps) {
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-secondary mb-3 hidden md:block">
        태그
      </h3>
      
      {/* Beyond xs: Vertical list */}
      <div className="flex md:flex-col md:overflow-x-auto scrollbar-hide gap-2">
        {tags.map((tag, index) => (
          <Tag key={index} tag={tag} onClick={onTagClick} selected={selectedTags.includes(tag)}/>
        ))}
      </div>
    </div>
  );
}