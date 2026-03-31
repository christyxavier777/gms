import { useId, useState } from 'react'

function matchesMember(member, searchText) {
  const normalizedSearch = searchText.trim().toLowerCase()
  const haystack = [member.name, member.email, member.phone].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(normalizedSearch)
}

export default function MemberSelector({
  label = 'Member',
  members = [],
  selectedId = '',
  onChange,
  disabled = false,
  hint = '',
  emptyMessage = 'No members available.',
  className = '',
}) {
  const [search, setSearch] = useState('')
  const baseId = useId()
  const inputId = `${baseId}-search`
  const selectId = `${baseId}-select`
  const hintId = `${baseId}-hint`
  const resultsId = `${baseId}-results`
  const summaryId = `${baseId}-summary`
  const normalizedSearch = search.trim()
  const filteredMembers = normalizedSearch
    ? members.filter((member) => matchesMember(member, normalizedSearch))
    : members
  const selectedMember = members.find((member) => member.id === selectedId) || null
  const visibleMembers =
    selectedMember && !filteredMembers.some((member) => member.id === selectedMember.id)
      ? [selectedMember, ...filteredMembers]
      : filteredMembers
  const shouldKeepSelectionVisible =
    Boolean(normalizedSearch) &&
    Boolean(selectedMember) &&
    !filteredMembers.some((member) => member.id === selectedMember?.id)

  return (
    <fieldset className={`space-y-3 ${className}`.trim()}>
      <legend className="block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{label}</legend>
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
          Search Directory
        </label>
        <input
          id={inputId}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled || members.length === 0}
          placeholder="Search by name, email, or phone"
          aria-describedby={[hint ? hintId : '', resultsId].filter(Boolean).join(' ') || undefined}
          className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none transition-colors focus:border-[#E21A2C] disabled:cursor-not-allowed disabled:opacity-60"
        />
        {hint && (
          <p id={hintId} className="text-xs text-gray-400">
            {hint}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
          Choose Member
        </label>
        <select
          id={selectId}
          value={selectedId}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || visibleMembers.length === 0}
          aria-describedby={[resultsId, selectedMember ? summaryId : ''].filter(Boolean).join(' ') || undefined}
          className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none transition-colors focus:border-[#E21A2C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Select member</option>
          {visibleMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>
      </div>

      {filteredMembers.length === 0 && !shouldKeepSelectionVisible ? (
        <p id={resultsId} className="text-sm text-gray-400" aria-live="polite">
          {emptyMessage}
        </p>
      ) : shouldKeepSelectionVisible ? (
        <p id={resultsId} className="text-sm text-gray-400" aria-live="polite">
          No new members match your search. The current selection is still available.
        </p>
      ) : (
        <p id={resultsId} className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]" aria-live="polite">
          {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'} match your search
        </p>
      )}

      {selectedMember && (
        <div
          id={summaryId}
          className="space-y-4 border border-white/10 bg-white/5 p-4 text-sm text-gray-300"
          aria-live="polite"
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(140px,0.8fr)] sm:items-start">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Selected Member</p>
              <p className="mt-1 font-semibold text-white">{selectedMember.name}</p>
            </div>
            <div className="min-w-0 sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Status</p>
              <p className="mt-1 break-words text-white">{selectedMember.status}</p>
            </div>
          </div>
          <div className="min-w-0 border-t border-white/10 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Contact</p>
            <p className="mt-1 break-all text-white">{selectedMember.email}</p>
            <p className="mt-1 text-gray-300">{selectedMember.phone}</p>
          </div>
        </div>
      )}
    </fieldset>
  )
}
