import { useTranslation } from 'react-i18next'

const bar = 'rounded-lg bg-navy/[0.07]'

// Grey boxes in the shape of what is coming, so the page does not look empty while it loads.
// "page": a whole page (title, a picture, some text). Without it: a row of cards inside a page (news, photos, videos...).
export default function Loading({ page = false }) {
    const { t } = useTranslation()
    const label = <span className="sr-only">{t('loading')}</span>

    if (page) {
        return (
            <div role="status" aria-live="polite" className="mx-auto min-h-[50vh] max-w-4xl animate-pulse px-5 py-10 motion-reduce:animate-none">
                {label}
                <div aria-hidden="true">
                    <div className={`h-8 w-2/3 ${bar}`} />
                    <div className={`mt-3 h-4 w-1/3 ${bar}`} />
                    <div className={`mt-8 aspect-[16/7] w-full rounded-2xl bg-navy/[0.07]`} />
                    {['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-2/3'].map((w, i) => <div key={i} className={`mt-4 h-4 ${w} ${bar}`} />)}
                </div>
            </div>
        )
    }

    return (
        <div role="status" aria-live="polite" className="grid gap-5 py-2 sm:grid-cols-2 lg:grid-cols-3">
            {label}
            {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden="true"
                    className={`animate-pulse overflow-hidden rounded-2xl border border-navy/10 bg-white motion-reduce:animate-none ${i === 2 ? 'hidden lg:block' : i === 1 ? 'hidden sm:block' : ''}`}>
                    <div className="aspect-[16/10] bg-navy/[0.07]" />
                    <div className="p-4">
                        <div className={`h-4 w-4/5 ${bar}`} />
                        <div className={`mt-3 h-3 w-full ${bar}`} />
                        <div className={`mt-2 h-3 w-2/3 ${bar}`} />
                    </div>
                </div>
            ))}
        </div>
    )
}