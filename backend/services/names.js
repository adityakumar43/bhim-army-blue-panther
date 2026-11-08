// Only the first name and the first letter of the last name, for public pages: "Ravi Kumar" -> "Ravi K."
// Enough for people to recognise a friend, without listing members' full names for anyone to collect.
export const shortName = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
    const first = (parts[0] || '').charAt(0).toUpperCase() + (parts[0] || '').slice(1)
    return parts.length > 1 ? `${first} ${parts.at(-1)[0].toUpperCase()}.` : first
}
