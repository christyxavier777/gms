import { Link } from 'react-router-dom'

export default function WorkflowEmptyState({
  eyebrow = 'Workflow',
  title,
  description,
  actions = [],
  notes = [],
  className = '',
}) {
  return (
    <section className={`border border-white/10 bg-white/5 p-5 backdrop-blur-[10px] ${className}`.trim()}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff8b5f]">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-300">{description}</p>

      {notes.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {notes.map((note) => (
            <div key={note} className="border-l-2 border-[#ff8b5f] bg-black/30 px-3 py-2">
              <p className="text-sm text-gray-300">{note}</p>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {actions.map((action) =>
            action.to ? (
              <Link
                key={`${action.label}-${action.to}`}
                to={action.to}
                className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] ${
                  action.variant === 'secondary'
                    ? 'border-white/20 text-white hover:border-white/40'
                    : 'border-[#E21A2C] bg-[#E21A2C] text-white hover:bg-[#c31626]'
                }`}
              >
                {action.label}
              </Link>
            ) : null,
          )}
        </div>
      )}
    </section>
  )
}
