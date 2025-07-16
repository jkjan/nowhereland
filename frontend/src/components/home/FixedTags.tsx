'use client';

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
      <h3 className="text-sm font-medium text-secondary mb-3 hidden lg:block">
        태그
      </h3>
      
      {/* Desktop: Vertical list */}
      <div className="hidden lg:flex lg:flex-col gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagClick?.(tag)}
            className={`px-3 py-2 rounded-theme text-sm font-medium transition-colors duration-200 text-left ${
              selectedTags.includes(tag)
                ? 'bg-accent text-primary'
                : 'bg-primary border border-neutral/20 text-secondary hover:border-accent/30 hover:text-accent'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
      
      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={`px-3 py-2 rounded-theme text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                selectedTags.includes(tag)
                  ? 'bg-accent text-primary'
                  : 'bg-primary border border-neutral/20 text-secondary hover:border-accent/30 hover:text-accent'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}