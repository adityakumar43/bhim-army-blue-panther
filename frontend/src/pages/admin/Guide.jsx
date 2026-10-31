import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { GUIDE } from '../../data/adminGuide.js'
import { ROLE_INFO } from '../../lib/roles.js'
import BoxIcon from '../../components/BoxIcon.jsx'
import { PageHeader } from './ui.jsx'

const LANG_KEY = 'guideLang'
const savedLang = () => { try { return localStorage.getItem(LANG_KEY) || 'hi' } catch { return 'hi' } }

// Only the guide is printed, not the menu around it
const PRINT = `@media print {
  header, nav, .no-print { display: none !important; }
  .admin-main { padding: 0 !important; }
  .guide-part { break-inside: avoid; box-shadow: none !important; }
}`

// One page that explains the admin panel, showing only the parts this person can use
export default function Guide() {
    const { me } = useOutletContext()
    const [lang, setLang] = useState(savedLang)
    const pickLang = (l) => { setLang(l); try { localStorage.setItem(LANG_KEY, l) } catch { /* storage blocked */ } }
    const can = (need) => !need.length || need.some((p) => me.permissions.includes(p))
    const parts = GUIDE.filter((g) => can(g.need))
    const role = ROLE_INFO[me.role]
    const hi = lang === 'hi'

    return (
        <>
            <style>{PRINT}</style>
            <PageHeader title={hi ? 'मार्गदर्शिका (Guide)' : 'Guide'} subtitle={hi ? 'एडमिन पैनल कैसे इस्तेमाल करें: केवल वे हिस्से जो आपकी भूमिका के लिए हैं।' : 'How to use the admin panel: only the parts for your role.'}>
                <div role="group" aria-label="Language" className="no-print inline-flex rounded-xl border border-brand/15 bg-white p-1">
                    {[['hi', 'हिंदी'], ['en', 'English']].map(([l, label]) => (
                        <button key={l} onClick={() => pickLang(l)} aria-pressed={lang === l}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${lang === l ? 'bg-brand text-white' : 'text-navy/70 hover:bg-mist'}`}>{label}</button>
                    ))}
                </div>
                <button onClick={() => window.print()} className="abtn no-print">🖨️ {hi ? 'प्रिंट करें' : 'Print'}</button>
            </PageHeader>

            {/* Who you are and what you can do */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gold/60 bg-gold/10 px-4 py-3">
                <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-sm font-extrabold text-navy">{role?.label}</span>
                <p className="text-sm text-navy/80">{role?.desc}</p>
            </div>

            {/* Contents */}
            <nav aria-label={hi ? 'विषय' : 'Contents'} className="no-print mb-5 flex flex-wrap gap-2">
                {parts.map((g) => (
                    <a key={g.id} href={`#guide-${g.id}`} className="rounded-full border border-brand/15 bg-white px-3 py-1.5 text-sm font-semibold text-brand hover:bg-mist">{g[lang].title}</a>
                ))}
            </nav>

            <div className="grid gap-4 xl:grid-cols-2">
                {parts.map((g) => (
                    <section key={g.id} id={`guide-${g.id}`} className="guide-part card scroll-mt-20 p-5">
                        <h2 className="mb-3 flex items-center gap-3 text-lg font-extrabold">
                            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand"><BoxIcon name={g.icon} size={20} /></span>
                            {g[lang].title}
                        </h2>
                        <ol className="flex flex-col gap-2.5">
                            {g[lang].steps.map((step, i) => (
                                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-navy/85">
                                    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                ))}
            </div>

            <p className="mt-6 rounded-xl bg-mist px-4 py-3 text-sm text-navy/75">
                {hi ? '❓ कुछ समझ न आए या कोई गड़बड़ दिखे, तो अपने राज्य एडमिन या सुपर एडमिन से संपर्क करें।' : '❓ If something is unclear or looks wrong, contact your State Admin or a Super Admin.'}
            </p>
        </>
    )
}
