import i18n from '../i18n.js'

// Messages that follow the page language. A form keeps WHICH message to show (its key and details)
// instead of the finished sentence, and say() translates it each time the page is drawn,
// so pressing हिं / EN changes an error that is already on the screen too.
//   setError(msg('help.pickState', { defaultValue: 'Please choose your state.' }))   ...   {say(t, error)}
// Details that depend on the language can be a function of it: msg('x', (lang) => ({ date: ... }))
export const msg = (key, options) => ({ key, options })

// The text to show: a kept message in the current language, or plain text (such as a reply from the server) as it is
export const say = (t, m) => (m && typeof m === 'object'
    ? t(m.key, typeof m.options === 'function' ? m.options(i18n.language) : m.options)
    : m)

// A failed request: "could not reach the server" follows the language; other replies from the server are shown as they are
export const fromError = (err) => (err?.offline ? msg('errors.offline', { defaultValue: err.message }) : err?.message)
