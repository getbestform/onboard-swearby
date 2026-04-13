export default function InvitesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-3 w-36 bg-secondary/20 rounded" />
          <div className="h-8 w-24 bg-secondary/20 rounded" />
        </div>
        <div className="h-10 w-28 bg-secondary/20 rounded" />
      </div>

      <div className="flex gap-3 mb-5">
        <div className="h-9 flex-1 max-w-xs bg-secondary/20 rounded" />
        <div className="h-9 w-32 bg-secondary/20 rounded" />
        <div className="h-9 w-36 bg-secondary/20 rounded" />
      </div>

      <div className="bg-white rounded-xl border border-secondary/15 overflow-hidden">
        <div className="border-b border-secondary/10 px-5 py-3 flex gap-8">
          {['Contact', 'Entity', 'Type', 'Status', 'Expires', 'Invited', 'Actions'].map((col) => (
            <div key={col} className="h-3 w-14 bg-secondary/15 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-secondary/8 px-5 py-3.5 flex gap-8 items-center">
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-32 bg-secondary/15 rounded" />
              <div className="h-3 w-44 bg-secondary/10 rounded" />
            </div>
            <div className="h-3.5 w-28 bg-secondary/15 rounded" />
            <div className="h-3.5 w-16 bg-secondary/15 rounded" />
            <div className="h-5 w-16 bg-secondary/15 rounded" />
            <div className="h-3.5 w-20 bg-secondary/15 rounded" />
            <div className="h-3.5 w-20 bg-secondary/15 rounded" />
            <div className="h-3.5 w-16 bg-secondary/15 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
