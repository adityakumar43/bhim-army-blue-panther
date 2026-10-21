// A small magnifier in the corner of a picture, so people can see (also on phones, which have no hover) that it opens larger
export default function ZoomBadge() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 flex h-9 w-9 items-center justify-center bg-gold text-navy rounded-full sm:opacity-0 sm:group-hover:opacity-100 motion-safe:transition">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 21l-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
      </svg>
    </span>
  )
}