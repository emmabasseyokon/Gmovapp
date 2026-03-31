import { PageHeaderSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton />
      <TableSkeleton rows={3} />
    </div>
  )
}
