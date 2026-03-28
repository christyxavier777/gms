export default function DashboardLoadingState({ label = 'Loading workspace', summaryCount = 4 }) {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">{label}...</p>

      <section className={`grid gap-4 sm:grid-cols-2 ${summaryCount >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        {Array.from({ length: summaryCount }).map((_, index) => (
          <div
            key={`summary-${index}`}
            className="h-28 animate-pulse border border-white/10 bg-white/5"
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="min-h-[220px] animate-pulse border border-white/10 bg-white/5" />
        <div className="min-h-[220px] animate-pulse border border-white/10 bg-white/5" />
      </section>
    </div>
  )
}
