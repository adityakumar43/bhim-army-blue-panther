import { useTranslation } from 'react-i18next'

// A spinning ring in the site's blue and gold, with "Loading..." under it.
// "page" fills the middle of the screen (while a whole page loads); without it, a smaller block inside a page.
export default function Loading({ page = false }) {
    const { t } = useTranslation()
    return (
        <div role="status" aria-live="polite"
            className={`flex flex-col items-center justify-center gap-3 text-navy/60 ${page ? 'min-h-[50vh] px-5 py-16' : 'py-10'}`}>
            <span aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-4 border-brand/15 border-t-brand border-r-gold motion-reduce:animate-none" />
            <span className="text-sm font-semibold">{t('loading')}</span>
        </div>
    )
}