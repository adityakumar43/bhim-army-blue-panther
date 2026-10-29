export const ROLES = {
  superadmin: ['content', 'leaders', 'members', 'messages', 'donations', 'helpdesk', 'admins', 'team'],
  editor: ['content', 'leaders'],
  membership: ['members', 'messages', 'helpdesk'],
  finance: ['donations'],
  stateadmin: ['members', 'leaders', 'helpdesk', 'team'], // only for their own state (see stateScope in middleware/auth.js); 'team' = their District admins
  districtadmin: ['district'], // only their own district: sees members and volunteers, recommends applications, handles help desk cases
}
export const can = (role, permission) => !!ROLES[role]?.includes(permission)




const REQUIRED = (process.env.REQUIRE_2FA_ROLES ?? 'superadmin,finance').split(',').map((s) => s.trim()).filter(Boolean)
export const needsTwoFactor = (role) => REQUIRED.includes(role)