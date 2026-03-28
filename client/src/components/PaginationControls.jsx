export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  totalPages,
  itemLabel = 'results',
  onPageChange,
}) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return null

  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = totalItems === 0 ? 0 : Math.min(totalItems, page * pageSize)

  return (
    <div className="mt-4 flex flex-col gap-3 border border-white/10 bg-black/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-300">
        Showing {firstItem}-{lastItem} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-200 transition hover:border-[#ff8b5f]/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-200 transition hover:border-[#ff8b5f]/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
