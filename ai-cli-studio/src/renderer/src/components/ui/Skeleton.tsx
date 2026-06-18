import { type FC } from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
)

export const CodeSkeleton: FC = () => (
  <div className="p-4 flex flex-col gap-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-full" />
  </div>
)

export const MarkdownSkeleton: FC = () => (
  <div className="p-6 flex flex-col gap-4">
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <Skeleton className="h-4 w-3/4" />
    <div className="h-4" />
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
)
