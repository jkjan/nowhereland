'use client';

import { Button } from '@/shared/ui/button';
import { cn } from '@/lib/utils';

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
      <div className="hidden md:flex md:flex-col gap-2">
        {tags.map((tag) => (
          <Button
            key={tag}
            onClick={() => onTagClick?.(tag)}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            size="sm"
            className={cn(
              "justify-start text-left h-auto px-3 py-2 w-fit min-w-0 border-0 transition-all duration-200",
              selectedTags.includes(tag) 
                ? "text-white pressed-effect" 
                : "text-white hover:brightness-90 shadow-sm hover:shadow-md"
            )}
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white'
            }}
          >
            #{tag}
          </Button>
        ))}
      </div>
      
      {/* xs only: Horizontal scroll */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {tags.map((tag) => (
            <Button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              className={cn(
                "whitespace-nowrap flex-shrink-0 h-auto px-3 py-2 w-fit min-w-0 border-0 transition-all duration-200",
                selectedTags.includes(tag) 
                  ? "text-white pressed-effect" 
                  : "text-white hover:brightness-90 shadow-sm hover:shadow-md"
              )}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white'
              }}
            >
              #{tag}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}