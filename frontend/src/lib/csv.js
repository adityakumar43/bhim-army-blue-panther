// Spreadsheet downloads from the admin panel.
// Excel and LibreOffice run a cell that starts with = + - @ (or a tab or line break) as a formula.
// Anyone can type such text into a public form, for example "=HYPERLINK(...)" as their name,
// so those cells get a ' in front and open as plain text. Plain numbers like "+91 98765 43210" stay as they are.
const FORMULA = /^[=+\-@\t\r\n]/
const NUMBER = /^[+-]?\d[\d .,]*$/

export function csvCell(v) {
  let s = String(v ?? '')
  if (FORMULA.test(s) && !NUMBER.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n')
