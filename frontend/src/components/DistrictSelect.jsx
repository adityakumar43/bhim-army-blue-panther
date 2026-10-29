import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { districtsOf, districtName } from '../data/districts.js'

// The districts of one state, in the page's language. It gives back the English name, so every district is saved the same way.
export default function DistrictSelect({ stateCode, value, onChange, required = false, className = 'input', english = false }) {
    const { t, i18n } = useTranslation()
    const lang = english ? 'en' : i18n.language
    const list = useMemo(() => districtsOf(stateCode)
        .map((d) => ({ en: d[0], label: districtName(d, lang) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)), [stateCode, lang])
    const current = list.some((d) => d.en === value) ? value : ''

    // A district that is not in this state's list (the state changed, or an old typed value) is cleared
    useEffect(() => { if (value && !current) onChange('') }, [value, current])

    return (
        <select value={current} onChange={(e) => onChange(e.target.value)} disabled={!stateCode} required={required}
            className={`${className} disabled:opacity-60`}>
            <option value="">{english ? (stateCode ? 'Choose...' : 'Choose the state first') : stateCode ? t('help.choose', { defaultValue: '— Choose —' }) : t('join.stateFirst', { defaultValue: 'Choose your state first' })}</option>
            {list.map((d) => <option key={d.en} value={d.en}>{d.label}</option>)}
        </select>
    )
}
