import { useId, useState } from 'react'

function matchesMember(member, searchText) {
  const haystack = `${member.name} ${member.email} ${member.phone}`.toLowerCase()
  return haystack.includes(searchText.toLowerCase())
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
  const filteredMembers = search.trim()
    ? members.filter((member) => matchesMember(member, search.trim()))
    : members
  const selectedMember = members.find((member) => member.id === selectedId) || null

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
          disabled={disabled || filteredMembers.length === 0}
          aria-describedby={[resultsId, selectedMember ? summaryId : ''].filter(Boolean).join(' ') || undefined}
          className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none transition-colors focus:border-[#E21A2C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Select member</option>
          {filteredMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>
      </div>

      {filteredMembers.length === 0 ? (
        <p id={resultsId} className="text-sm text-gray-400" aria-live="polite">
          {emptyMessage}
        </p>
      ) : (
        <p id={resultsId} className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]" aria-live="polite">
          {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'} match your search
        </p>
      )}

      {selectedMember && (
        <div
          id={summaryId}
          className="grid gap-3 border border-white/10 bg-white/5 p-4 text-sm text-gray-300 sm:grid-cols-3"
          aria-live="polite"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Selected Member</p>
            <p className="mt-1 font-semibold text-white">{selectedMember.name}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Contact</p>
            <p className="mt-1 text-white">{selectedMember.email}</p>
            <p className="text-gray-300">{selectedMember.phone}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Status</p>
            <p className="mt-1 text-white">{selectedMember.status}</p>
          </div>
        </div>
      )}
    </fieldset>
  )
}
