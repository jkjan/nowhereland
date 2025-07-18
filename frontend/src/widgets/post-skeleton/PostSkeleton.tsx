import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export default function PostSkeleton() {
  return (
    <div className="block group">
      <Card className="p-4 mb-4 shadow-md border-0">
        <div className="flex gap-4">
          {/* Thumbnail skeleton */}
          <div className="flex-shrink-0">
            <Skeleton className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32" />
          </div>
          
          {/* Content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4" />
            
            {/* Abstract skeleton */}
            <div className="mt-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            {/* Metadata skeleton */}
            <div className="flex items-center gap-2 md:gap-4 mt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            
            {/* Tags skeleton */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}