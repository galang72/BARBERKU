export default function LoadingPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 rounded-lg" />
          <div className="h-4 w-56 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 rounded-lg" />
          <div className="h-10 w-28 bg-blue-100 rounded-lg" />
        </div>
      </div>
      <div className="h-11 w-full max-w-sm bg-slate-100 rounded-xl" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
          ))}
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="p-4 border-b border-slate-50 flex gap-4 items-center">
            <div className="h-9 w-9 bg-slate-100 rounded-full flex-shrink-0" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
            ))}
            <div className="h-6 w-20 bg-blue-50 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
