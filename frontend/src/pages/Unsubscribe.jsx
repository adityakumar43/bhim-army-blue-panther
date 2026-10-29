import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'

// The "stop these emails" link in announcement emails. One tap to confirm, so a link checker cannot do it by accident.
export default function Unsubscribe() {
    const { token } = useParams()
    const { t } = useTranslation()
    const [state, setState] = useState('ask') // ask, busy, done, error
    const [error, setError] = useState('')

    async function stop() {
        setState('busy')
        try {
            await api.post('/mailouts/unsubscribe', { token })
            setState('done')
        } catch (e) {
            setError(e.message)
            setState('error')
        }
    }

    return (
        <div className="mx-auto max-w-md px-5 py-16">
            <section className="rounded-2xl border border-navy/10 bg-white p-6 text-center shadow-sm sm:p-8">
                {state === 'done' ? (
                    <>
                        <p className="text-5xl" aria-hidden="true">✅</p>
                        <h1 className="mt-3 text-2xl font-extrabold">{t('unsub.doneTitle', { defaultValue: 'Done' })}</h1>
                        <p className="mt-2 text-navy/75">{t('unsub.doneBody', { defaultValue: 'You will not get announcement emails any more. You are still a member.' })}</p>
                    </>
                ) : (
                    <>
                        <p className="text-5xl" aria-hidden="true">✉️</p>
                        <h1 className="mt-3 text-2xl font-extrabold">{t('unsub.title', { defaultValue: 'Stop announcement emails?' })}</h1>
                        <p className="mt-2 text-navy/75">{t('unsub.body', { defaultValue: 'You will stop getting announcement emails from Bhim Army Blue Panther. Your membership stays the same.' })}</p>
                        {state === 'error' && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">⚠️ {error}</p>}
                        <button onClick={stop} disabled={state === 'busy'} className="btn mt-6 w-full bg-brand text-white hover:bg-navy disabled:opacity-60">
                            {state === 'busy' ? '…' : t('unsub.button', { defaultValue: 'Yes, stop these emails' })}
                        </button>
                    </>
                )}
                <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand underline">{t('nav.home', { defaultValue: 'Home' })}</Link>
            </section>
        </div>
    )
}
