import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Opening a new page starts at the top (React keeps the old scroll position otherwise, so a link
// clicked in the footer opened the next page at its footer).
// - A link with #part (like /privacy#rights) goes to that part once the page has loaded.
// - The browser's Back and Forward buttons keep the place you were at.
// - Changing only the ?part of the address (a tab or a filter on the same page) keeps the place too.
export default function ScrollToTop() {
    const { pathname, hash } = useLocation()
    const nav = useNavigationType() // 'PUSH' (a link), 'REPLACE', or 'POP' (Back / Forward)

    useLayoutEffect(() => {
        if (nav === 'POP') return
        if (!hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            return
        }
        // The page may still be loading, so look for the part a few times
        let tries = 0
        const find = () => {
            const el = document.getElementById(decodeURIComponent(hash.slice(1)))
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            else if (tries++ < 20) timer = setTimeout(find, 100)
        }
        let timer = setTimeout(find, 0)
        return () => clearTimeout(timer)
    }, [pathname, hash]) // eslint-disable-line react-hooks/exhaustive-deps -- not nav: a tab switch changes it without opening a new page

    return null
}
