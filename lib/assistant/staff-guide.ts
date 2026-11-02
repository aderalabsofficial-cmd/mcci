import type { StaffModule } from '@/lib/permissions/levels';

/**
 * Ask MCCI AI for staff: "where do I do this?" Each entry is a task, the screen it happens on and the access it needs.
 * It always works, with or without an AI key, because the matching below needs no model; when the assistant is on, the
 * model only words the answer. It never takes an action and shows only screens the person may open.
 */
export interface GuideItem {
  key: string;
  href: string;
  module: StaffModule;
  level: number;
  /** words people use, English and Urdu */
  words: string[];
}

export const GUIDE: GuideItem[] = [
  { key: 'voter', href: '/admin/reports?pillar=membership', module: 'vot', level: 1, words: ['voter', 'voters', 'vote', 'election', 'cutoff', 'eligible', 'ووٹر', 'ووٹ', 'انتخاب', 'الیکشن'] },
  { key: 'renew', href: '/admin/members', module: 'reg', level: 2, words: ['renew', 'renewal', 'subscription', 'valid till', 'expire', 'تجدید', 'رینیول'] },
  { key: 'season', href: '/admin/members', module: 'reg', level: 3, words: ['renewal date', 'renewal from', 'open renewals', 'season', 'dgto', 'gazette', 'تجدید کی تاریخ'] },
  { key: 'restore', href: '/admin/members?show=lapsed', module: 'reg', level: 2, words: ['restore', 'restoration', 'lapsed', 'arrears', 'dues', 'tax return', 'بحالی', 'بقایا', 'ٹیکس ریٹرن'] },
  { key: 'enrollment', href: '/admin/members?show=noDate', module: 'reg', level: 2, words: ['enrollment', 'enrolment', 'old member', 'legacy', 'secp', 'fbr', 'incorporation', 'date missing', 'اندراج', 'پرانا ممبر'] },
  { key: 'member', href: '/admin/members', module: 'reg', level: 1, words: ['member', 'members', 'register', 'record', 'find member', 'company', 'ممبر', 'رجسٹر', 'کمپنی'] },
  { key: 'addMember', href: '/admin/members', module: 'reg', level: 2, words: ['add member', 'new member', 'existing member', 'ممبر شامل'] },
  { key: 'import', href: '/admin/import', module: 'reg', level: 2, words: ['import', 'excel', 'csv', 'upload members', 'امپورٹ', 'ایکسل'] },
  { key: 'declaration', href: '/admin/changes', module: 'chg', level: 1, words: ['change', 'declaration', 'partner', 'deed', 'representative', 'approve change', 'intimation', 'تبدیلی', 'اقرار نامہ', 'شراکت'] },
  { key: 'application', href: '/admin/requests', module: 'mem', level: 1, words: ['application', 'applicant', 'new membership', 'pipeline', 'review', 'درخواست', 'نئی ممبرشپ'] },
  { key: 'committee', href: '/admin/committee', module: 'cmt', level: 1, words: ['committee', 'convener', 'approve application', 'agenda', 'کمیٹی'] },
  { key: 'certificate', href: '/admin/temp', module: 'temp', level: 1, words: ['certificate', 'scan', 'stamp', 'print', 'سرٹیفکیٹ'] },
  { key: 'payment', href: '/admin/payments', module: 'pay', level: 1, words: ['payment', 'receipt', 'verify payment', 'voucher', 'fee', 'admission', 'corporate payment', 'associate payment', 'ادائیگی', 'رسید', 'واؤچر', 'فیس'] },
  { key: 'statement', href: '/admin/finance', module: 'fin', level: 1, words: ['profit', 'loss', 'p&l', 'statement', 'income', 'receipts', 'accounts', 'nafa', 'منافع', 'نقصان', 'گوشوارہ', 'اکاؤنٹس', 'آمدن'] },
  { key: 'trial', href: '/admin/finance?tab=trial', module: 'fin', level: 1, words: ['trial balance', 'debit', 'credit', 'ٹرائل بیلنس'] },
  { key: 'expense', href: '/admin/finance?tab=entries', module: 'fin', level: 2, words: ['expense', 'expenses', 'bill', 'salary', 'fuel', 'utility', 'electricity', 'entry', 'record', 'خرچ', 'اخراجات', 'بل', 'تنخواہ', 'ایندھن'] },
  { key: 'verifyEntry', href: '/admin/finance?tab=entries', module: 'fin', level: 3, words: ['verify entry', 'audit', 'void', 'wrong entry', 'آڈٹ', 'تصدیق'] },
  { key: 'bank', href: '/admin/finance?tab=setup', module: 'fin', level: 2, words: ['bank', 'balance', 'opening', 'close month', 'reconcile', 'بینک', 'بیلنس'] },
  { key: 'service', href: '/admin/applications', module: 'svc', level: 1, words: ['service', 'visa', 'letter', 'e-bil', 'attestation', 'certificate of origin', 'sla', 'سروس', 'ویزا', 'خط', 'تصدیق نامہ'] },
  { key: 'staff', href: '/admin/staff', module: 'staff', level: 1, words: ['staff', 'invite', 'employee', 'designation', 'add staff', 'عملہ', 'عہدہ'] },
  { key: 'permission', href: '/admin/staff', module: 'staff', level: 3, words: ['permission', 'access', 'rights', 'role', 'limit', 'officer', 'assign service', 'password', 'اجازت', 'رسائی', 'اختیار'] },
  { key: 'audit', href: '/admin/audit', module: 'staff', level: 1, words: ['audit trail', 'who did', 'log', 'history', 'کس نے'] },
  { key: 'post', href: '/admin/content', module: 'eng', level: 1, words: ['news', 'notice', 'circular', 'post', 'publish', 'website', 'media', 'photo', 'image', 'خبر', 'نوٹس', 'سرکلر', 'تصویر'] },
  { key: 'event', href: '/admin/events', module: 'eng', level: 1, words: ['event', 'events', 'meeting', 'seminar', 'تقریب', 'میٹنگ'] },
  { key: 'complaint', href: '/admin/complaints', module: 'eng', level: 1, words: ['complaint', 'ticket', 'support', 'شکایت'] },
  { key: 'whatsapp', href: '/admin/whatsapp/campaigns/new', module: 'out', level: 2, words: ['whatsapp', 'broadcast', 'bulk', 'campaign', 'send message', 'voice', 'واٹس ایپ', 'پیغام', 'مہم'] },
  { key: 'template', href: '/admin/whatsapp/templates', module: 'out', level: 1, words: ['template', 'meta', 'approved template', 'ٹیمپلیٹ'] },
  { key: 'consent', href: '/admin/whatsapp/consent', module: 'out', level: 1, words: ['consent', 'opt out', 'stop', 'suppression', 'رضامندی'] },
  { key: 'directory', href: '/admin/business-directory', module: 'biz', level: 1, words: ['directory', 'segment', 'filter businesses', 'export', 'ڈائریکٹری'] },
  { key: 'settings', href: '/admin/settings', module: 'plat', level: 1, words: ['settings', 'fees', 'fee schedule', 'chamber details', 'bank account', 'سیٹنگز'] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}&\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** The best tasks for a question. A longer phrase counts for more; the person's access decides what is offered. */
export function matchGuide(question: string, levelOf: (m: StaffModule) => number, limit = 3): GuideItem[] {
  const q = norm(question);
  if (!q) return [];
  const tokens = new Set(q.split(' '));
  return GUIDE.filter((g) => levelOf(g.module) >= g.level)
    .map((g) => {
      let score = 0;
      for (const w of g.words) {
        const word = norm(w);
        if (word.includes(' ') ? q.includes(word) : tokens.has(word)) score += word.split(' ').length * 2;
        else if (word.length > 4 && [...tokens].some((t) => t.length > 3 && (t.startsWith(word) || word.startsWith(t)))) score += 1;
      }
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.g);
}

/** a date written in the question ("13 July 2028", "2028-07-13", "13/07/2028"), for the voter list link */
export function dateInQuestion(question: string): string | null {
  const iso = question.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2]!.padStart(2, '0')}-${iso[3]!.padStart(2, '0')}`;
  const dmy = question.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2]!.padStart(2, '0')}-${dmy[1]!.padStart(2, '0')}`;
  const names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const word = question.toLowerCase().match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\s+(\d{4})\b/) ?? null;
  const other = question.toLowerCase().match(/\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/) ?? null;
  const parts = word ? { d: word[1]!, m: word[2]!, y: word[3]! } : other ? { d: other[2]!, m: other[1]!, y: other[3]! } : null;
  if (!parts) return null;
  const idx = names.indexOf(parts.m.slice(0, 3));
  return idx < 0 ? null : `${parts.y}-${String(idx + 1).padStart(2, '0')}-${parts.d.padStart(2, '0')}`;
}
