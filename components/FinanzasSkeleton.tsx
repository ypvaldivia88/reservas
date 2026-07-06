function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className ?? ""}`}
    />
  );
}

export default function FinanzasSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <SkeletonBlock className="h-4 w-28 mb-3" />
            <SkeletonBlock className="h-8 w-36 mb-2" />
            <SkeletonBlock className="h-3 w-44" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <SkeletonBlock className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between gap-4">
                  <SkeletonBlock className="h-4 flex-1" />
                  <SkeletonBlock className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <SkeletonBlock className="h-5 w-32" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-3 items-center">
              <SkeletonBlock className="h-4 col-span-1" />
              <SkeletonBlock className="h-6 col-span-1 rounded-full" />
              <SkeletonBlock className="h-4 col-span-2" />
              <SkeletonBlock className="h-4 col-span-1" />
              <SkeletonBlock className="h-4 col-span-1" />
              <SkeletonBlock className="h-4 col-span-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
