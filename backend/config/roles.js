export const ROLES = {
  superadmin: ['content', 'members', 'messages', 'donations', 'admins'],
  editor: ['content'],              
  membership: ['members', 'messages'],
  finance: ['donations'],
}

export const can = (role, permission) => !!ROLES[role]?.includes(permission)
