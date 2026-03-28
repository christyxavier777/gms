const variantStyles = {
  error: {
    container: 'border border-[#E21A2C]/35 bg-[#E21A2C]/10 text-[#ffd7dc]',
    eyebrow: 'text-[#ff8b98]',
    message: 'text-[#ffd7dc]',
  },
  success: {
    container: 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
    eyebrow: 'text-emerald-200',
    message: 'text-emerald-100',
  },
  info: {
    container: 'border border-white/15 bg-white/5 text-gray-100',
    eyebrow: 'text-[#ff8b5f]',
    message: 'text-gray-200',
  },
}

const defaultTitles = {
  error: 'Action needed',
  success: 'Success',
  info: 'Notice',
}

export default function StatusBanner({
  variant = 'error',
  title,
  message,
  id,
  actions,
  children,
  className = '',
}) {
  const styles = variantStyles[variant] || variantStyles.info
  const role = variant === 'error' ? 'alert' : 'status'
  const live = variant === 'error' ? 'assertive' : 'polite'

  return (
    <div
      id={id}
      role={role}
      aria-live={live}
      className={`${styles.container} px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${className}`.trim()}
    >
      <p className={`text-xs font-bold uppercase tracking-[0.12em] ${styles.eyebrow}`}>
        {title || defaultTitles[variant] || defaultTitles.info}
      </p>
      {message && <p className={`mt-1 text-sm ${styles.message}`}>{message}</p>}
      {children}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
