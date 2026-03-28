import { Link } from 'react-router-dom'

export default function RouteStatusScreen({
  eyebrow = 'Gym OS',
  title,
  description,
  actions = [],
  loading = false,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_15%_15%,rgba(226,26,44,0.18),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(255,132,72,0.14),transparent_32%),linear-gradient(140deg,#070a0f_0%,#0f1620_54%,#0b1017_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-xl border border-white/10 bg-black/40 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff8b5f]">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-white">{title}</h1>
        <p className="mt-3 text-sm text-gray-300">{description}</p>

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#ff8b5f]" />
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#E21A2C] [animation-delay:120ms]" />
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#ff8b5f] [animation-delay:240ms]" />
          </div>
        )}

        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {actions.map((action) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
