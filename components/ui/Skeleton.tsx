export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-gray-200/60 p-5 shadow-elegant">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
  )
}

export function GroupListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ExpenseCardSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-gray-200/60 p-4 shadow-elegant">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-shrink-0 text-right space-y-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

export function ExpenseListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ExpenseCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ExpenseDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
      <div className="mb-6">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="max-w-2xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="mb-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border-2 border-gray-300 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
