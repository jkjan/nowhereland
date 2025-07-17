import { Post } from "@/entities/post/model/types";
import { useTranslation } from "@/shared/lib/i18n";
import { Card } from "@/shared/ui/card";
import Tag from "@/shared/ui/tag";
import Link from "next/link";
import Image from "next/image";

export default function PostItem({ post }: { post: Post }) {
    const { t } = useTranslation();
    
    return (
      <Link href={`/post/${post.id}`} className="block group">
        <Card className="p-4 mb-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:-translate-x-0.5 hover:shadow-primary/20 border-0 bg-white text-black">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {post.thumbnail ? (
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  width={128}
                  height={128}
                  className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 object-cover rounded-md shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-secondary shadow-sm rounded-md flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
                {post.title}
              </h2>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm md:text-sm lg:text-base">
                {post.abstract}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-2 md:gap-4 mt-2 text-xs md:text-xs lg:text-sm text-muted-foreground">
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                <span>{t('post.viewCount', { count: post.view_count })}</span>
              </div>
              
              {/* Tags - accent colored as requested */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Tag 
                      key={index}
                      tag={tag}
                      />
                  ))}
                  {post.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-neutral/20 text-neutral rounded-full shadow-sm">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }