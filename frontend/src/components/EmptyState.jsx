import { useTranslation } from 'react-i18next'
import BoxIcon from './BoxIcon.jsx'

// Shown when a page has nothing in it yet (no photos, no news): a friendly box instead of one small line
// hint={false} leaves out the "check back later" line (when the text already says it)
export default function EmptyState({ icon = 'news', text, hint = true }) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy/15 bg-white px-6 py-14 text-center shadow-sm sm:py-16">
            <span aria-hidden="true" className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mist text-brand">
                <BoxIcon name={icon} size={30} />
            </span>
            <p className="text-lg font-bold text-navy">{text || t('empty')}</p>
            {hint && <p className="mt-1 max-w-sm text-navy/65">{t('emptyHint', { defaultValue: 'New posts will appear here soon. Please check back later.' })}</p>}
        </div>
    )
}
