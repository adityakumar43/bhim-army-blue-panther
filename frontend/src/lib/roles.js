
export const ROLE_INFO = {
  superadmin: { label: 'Super Admin', desc: 'Everything, including adding team members and changing roles.' },
  editor: { label: 'Content Editor', desc: 'Publishes and edits news, events and gallery photos only.' },
  membership: { label: 'Membership Manager', desc: 'Approves members and reads contact messages.' },
  finance: { label: 'Finance', desc: 'Sees donations and receipts only.' },
  stateadmin: { label: 'State Admin', desc: 'Approves members and manages leaders of one state only, and adds its District admins.' },
  districtadmin: { label: 'District Admin', desc: 'One district only: sees its members and volunteers, recommends applications, and handles its help desk cases.' },
}
