// Fails if a relative import points at a file that does not exist.
// Names are compared exactly, so a capital-letter mistake that works on Windows
// but crashes on the Linux server is caught here.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = process.argv[2] || '.'
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.js')) files.push(path)
  }
}
walk(root)

// true only if every part of the path exists with exactly this spelling
const existsExactly = (path) => {
  let dir = '.'
  for (const part of path.split('/')) {
    if (part === '.' || part === '') continue
    if (part === '..') { dir = join(dir, '..'); continue }
    let names
    try { names = readdirSync(dir) } catch { return false }
    if (!names.includes(part)) return false
    dir = join(dir, part)
  }
  return true
}

const bad = []
for (const file of files) {
  const code = readFileSync(file, 'utf8')
  // import x from './a.js' · export { x } from './a.js' · import './a.js' · import('./a.js')
  const found = code.matchAll(/(?:import|export)[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)
  for (const m of found) {
    const spec = m[1] || m[2]
    const target = relative('.', join(dirname(file), spec)).split('\\').join('/')
    if (!existsExactly(target)) bad.push(`${file}: cannot find "${spec}"`)
  }
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1) }
console.log(`Checked ${files.length} files: every relative import exists.`)
