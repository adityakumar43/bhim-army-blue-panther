import { useState } from 'react'
import { thumb } from '../data/videos.js'

// Shows the thumbnail first and loads YouTube only when tapped, so pages stay fast on mobile data
export default function YouTubeLite({ id, title }) {
    const [play, setPlay] = useState(false)
    if (play) {
        return (
            <div className="relative aspect-video w-full overflow-hidden bg-black">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                />
            </div>
        )
    }
    return (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Play: ${title}`}
            className="group relative block aspect-video w-full overflow-hidden bg-navy">
            <img src={thumb(id)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            <span className="absolute inset-0 bg-navy/20 transition group-hover:bg-navy/10" />
            <span aria-hidden="true" className="absolute top-1/2 left-1/2 flex h-14 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600 shadow-lg transition group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white"><path d="M8 5v14l11-7z" /></svg>
            </span>
        </button>
    )
}
