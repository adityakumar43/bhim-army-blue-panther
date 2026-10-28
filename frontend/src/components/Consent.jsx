import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// "I agree" tick box before a form is sent. `text` is what the person agrees to (it ends with a link to the policy).
export default function Consent({ checked, onChange, text, error = false }) {
    const { t } = useTranslation()
    return (
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${checked ? 'border-green-500 bg-green-50' : error ? 'border-red-300 bg-red-50' : 'border-navy/15 bg-white hover:border-brand/40'}`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-green-600" />
            <span className="text-sm leading-relaxed text-navy/85">
                {text}{' '}
                <Link to="/privacy" target="_blank" className="font-semibold text-brand underline">{t('privacy.read', { defaultValue: 'Read the Privacy Policy' })}</Link>
                <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>
            </span>
        </label>
    )
}
