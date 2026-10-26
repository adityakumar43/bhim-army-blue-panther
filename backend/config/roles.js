export const ROLES = {
  superadmin: ['content', 'leaders', 'members', 'messages', 'donations', 'helpdesk', 'admins'],
  editor: ['content', 'leaders'],
  membership: ['members', 'messages', 'helpdesk'],
  finance: ['donations'],
  stateadmin: ['members', 'leaders', 'helpdesk'], // only for their own state (see stateScope in middleware/auth.js)
}
export const can = (role, permission) => !!ROLES[role]?.includes(permission)




const REQUIRED = (process.env.REQUIRE_2FA_ROLES ?? 'superadmin,finance').split(',').map((s) => s.trim()).filter(Boolean)
export const needsTwoFactor = (role) => REQUIRED.includes(role)