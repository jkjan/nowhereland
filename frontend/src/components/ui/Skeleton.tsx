interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export default function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style = {
    width,
    height,
  };

  return (
    <div
      className={`animate-pulse bg-neutral/20 rounded-theme ${className}`}
      style={style}
    />
  );
}