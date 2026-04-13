export default function InviteDetailLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-secondary/15 rounded mb-3" />
          <div className="h-3 w-36 bg-secondary/15 rounded" />
          <div className="h-8 w-48 bg-secondary/20 rounded" />
          <div className="h-4 w-40 bg-secondary/15 rounded" />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-5 w-16 bg-secondary/15 rounded" />
          <div className="h-4 w-28 bg-secondary/15 rounded" />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-secondary/15 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary/10">
              <div className="h-3 w-24 bg-secondary/15 rounded" />
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className="h-2.5 w-20 bg-secondary/10 rounded" />
                  <div className="h-4 w-36 bg-secondary/15 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
