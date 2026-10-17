export const ROLES = {
  superadmin: ['content', 'members', 'messages', 'donations', 'admins'],
  editor: ['content'],              
  membership: ['members', 'messages'],
  finance: ['donations'],
}

export const can = (role, permission) => !!ROLES[role]?.includes(permission)




const REQUIRED = (process.env.REQUIRE_2FA_ROLES ?? 'superadmin,finance').split(',').map((s) => s.trim()).filter(Boolean)
export const needsTwoFactor = (role) => REQUIRED.includes(role)