/** icon (components/membership/ui Ic names) and colour of each service, as in the prototype M.SV */
export const SVC_LOOK: Record<string, { icon: string; color: string }> = {
  ebil: { icon: 'send', color: '#3b82f6' },
  visa: { icon: 'users', color: '#14b8a6' },
  guar: { icon: 'shield', color: '#ef4444' },
  sample: { icon: 'folder', color: '#f59e0b' },
  other: { icon: 'file', color: '#8b5cf6' },
  co: { icon: 'landmark', color: '#c8963e' },
  att: { icon: 'badge', color: '#1b4f9c' },
};
export const svcLook = (key: string) => SVC_LOOK[key] ?? { icon: 'file', color: '#1b4f9c' };

/** status → badge colour (prototype bd()) */
export const SVC_TONE: Record<string, string> = {
  Submitted: 'blue',
  'In review': 'orange',
  Returned: 'red',
  'Ready to sign': 'orange',
  Issued: 'green',
  Rejected: 'red',
  Cancelled: 'gray',
};
