import { useTranslation } from 'react-i18next'

// Shown when the server could not be reached (not when there is simply nothing yet), with a Try again button
export default function LoadFailed({ onRetry, className = '' }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className={`rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center ${className}`}>
      <p className="text-red-800">⚠️ {t('errors.offline')}</p>
      <button type="button" onClick={onRetry} className="btn mt-4 bg-brand text-white hover:bg-navy">{t('errors.retry')}</button>
    </div>
  )
}
