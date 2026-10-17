export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-navy/70">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Notice({ kind = 'error', children }) {
  if (!children) return null
  const style = kind === 'error' ? 'border-red-300 bg-red-50 text-red-900' : 'border-green-300 bg-green-50 text-green-900'
  return (
    <p role={kind === 'error' ? 'alert' : 'status'} className={`mb-4 border p-3 ${style}`}>{children}</p>
  )
}

const TONES = {
  blue: 'bg-mist text-brand',
  gold: 'bg-gold/30 text-navy',
  green: 'bg-green-100 text-green-900',
  red: 'bg-red-100 text-red-900',
  gray: 'bg-navy/10 text-navy',
}

export function Pill({ tone = 'blue', children }) {
  return <span className={`inline-block px-2.5 py-0.5 text-sm font-semibold ${TONES[tone]}`}>{children}</span>
}
