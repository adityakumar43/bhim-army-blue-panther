import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Tabs that stay on screen just under the site's header while the page scrolls (News | Events, Photos | Culture).
// Put it directly inside the page's outer box (not inside a small wrapper), or it cannot stick.
// tabs: [{ key, label, short?, badge? }]. short is a shorter label for phones. After switching while far down the page, the new tab starts at its top.
export default function StickyTabs({ tabs, value, onChange, label, idPrefix = 'tab' }) {
  const mark = useRef(null) // an empty spot where the tabs sit before they start to stick
  const [headerH, setHeaderH] = useState(0)
  const switched = useRef(false)

  // The header's height changes with the screen size, so it is measured
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const measure = () => setHeaderH(header.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  // Done once the new tab is on screen, so the page's new height is known
  useLayoutEffect(() => {
    if (!switched.current || !mark.current) return
    switched.current = false
    const top = mark.current.getBoundingClientRect().top + window.scrollY - headerH
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'instant' })
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  function choose(key) {
    if (key === value) return
    switched.current = true
    onChange(key)
  }

  return (
    <>
      <span ref={mark} aria-hidden="true" className="block" />
      <div style={{ top: headerH }} className="sticky z-30 border-b border-navy/10 bg-white/95 shadow-sm backdrop-blur">
        <div role="tablist" aria-label={label} className="mx-auto flex max-w-6xl gap-2 px-5 py-2 lg:px-8">
          {tabs.map(({ key, label: text, short, badge }) => {
            const on = key === value
            return (
              <button key={key} type="button" role="tab" id={`${idPrefix}-${key}`} aria-selected={on} aria-controls={`${idPrefix}-panel-${key}`} onClick={() => choose(key)}
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-bold motion-safe:transition sm:flex-none sm:px-6 ${on ? 'bg-brand text-white shadow-sm' : 'text-navy hover:bg-mist'}`}>
                {short ? <><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{text}</span></> : text}
                {badge > 0 && <span className={`rounded-full px-2 text-sm ${on ? 'bg-white/25' : 'bg-brand text-white'}`}>{badge}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
