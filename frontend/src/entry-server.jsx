import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App.jsx'
import './i18n.js'

// Used only while building (scripts/prerender.js): turns a page into plain HTML, so the Home page can be
// shown the moment it opens, before the app's code has downloaded. Visitors' browsers never load this file.
export function render(url) {
  return renderToString(<StaticRouter location={url}><App /></StaticRouter>)
}
