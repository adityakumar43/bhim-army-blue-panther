import { Component } from 'react'
import i18n from '../i18n.js'

// When something on a page goes wrong, React removes everything and the visitor sees a white screen.
// This catches it instead: the header and footer stay, and the page says so, with Reload and Home buttons.
// Opening another page (a new resetKey) gives it a fresh start.
//   quiet: show nothing at all (for small parts, like the updates bar, that can simply disappear)
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Page error:', error)
  }

  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    if (this.props.quiet) return null
    const t = (key, fallback) => i18n.t(key, { defaultValue: fallback })
    return (
      <div role="alert" className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">⚠️</p>
        <h1 className="mt-3 text-2xl font-extrabold">{t('errors.pageTitle', 'Something went wrong on this page')}</h1>
        <p className="mt-2 text-navy/75">{t('errors.pageBody', 'Please reload the page. If it keeps happening, please let us know.')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn bg-brand text-white hover:bg-navy">🔄 {t('errors.reload', 'Reload')}</button>
          <a href="/" className="btn border-2 border-brand bg-white text-brand hover:bg-mist">🏠 {t('nav.home', 'Home')}</a>
        </div>
      </div>
    )
  }
}
