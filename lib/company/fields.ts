/**
 * Registered particulars shown on Company Profile, in the prototype's order (member.js `profile`), limited to what
 * `companies` holds today. Representative, CNIC and partners come from the approved application (M3).
 * Labels: messages `access.company.fields.<key>`.
 */
export const PARTICULAR_FIELDS = [
  'name',
  'address',
  'ntn',
  'gst',
  'tel',
  'email',
  'web',
  'particulars',
  'established',
] as const;

export type ParticularField = (typeof PARTICULAR_FIELDS)[number];
