'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { asLocale } from '@/i18n/locale';
import { sendInvitation } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';
import { PermissionError, requirePermission } from '@/lib/permissions/server';
import { BIZ_TYPES } from '@/lib/membership/reference';
import { createClient } from '@/lib/supabase/server';

/**
 * Members Register, minimal (mem.add): staff with module 'reg' ≥ 2 add an existing MCCI member (company, class,
 * membership number, representative, validity) and invite its owner by email; the owner then signs in to MCCI Digital
 * and can endorse applicants (docs/04). The full register, Excel import and change requests are M8.
 */

export interface MemberAddResult {
  ok: boolean;
  message: string;
}

const schema = z.object({
  company: z.string().trim().min(2).max(200),
  biz: z.enum(BIZ_TYPES),
  cls: z.enum(['Corporate', 'Associate']),
  memberNo: z.union([z.literal(''), z.string().trim().toUpperCase().regex(/^MCCI-[CA]-\d{3,6}$/)]),
  rep: z.string().trim().min(2).max(120),
  since: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sector: z.string().trim().max(40),
  women: z.boolean(),
  email: z.string().trim().toLowerCase().email().max(254),
  owner: z.string().trim().min(2).max(120),
});

export async function addMember(form: FormData): Promise<MemberAddResult> {
  const locale = asLocale(String(form.get('locale') ?? 'en'));
  try {
    const actor = await requirePermission('reg', 2);
    const p = schema.safeParse({
      company: form.get('company'),
      biz: form.get('biz'),
      cls: form.get('cls'),
      memberNo: form.get('memberNo') ?? '',
      rep: form.get('rep'),
      since: form.get('since') ?? '',
      validTo: form.get('validTo'),
      sector: form.get('sector') ?? '',
      women: form.get('women') === 'on',
      email: form.get('email'),
      owner: form.get('owner'),
    });
    if (!p.success) return { ok: false, message: msg(locale, 'register.errors.fields') };
    const d = p.data;
    const supabase = await createClient();
    const { data, error } = await supabase.schema('api').rpc('member_add', {
      p_company: d.company,
      p_biz: d.biz,
      p_class: d.cls,
      p_member_no: d.memberNo,
      p_rep: d.rep,
      p_since: d.since || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }),
      p_valid_to: d.validTo,
      p_sector: d.sector,
      p_women: d.women,
      p_owner_email: d.email,
      p_owner_name: d.owner,
    });
    if (error) {
      if (error.code === '42501') return { ok: false, message: msg(locale, 'register.errors.notAllowed') };
      if (error.hint === 'member_no' || error.hint === 'member_no_taken') return { ok: false, message: msg(locale, `register.errors.${error.hint}`) };
      if (error.hint === 'email') return { ok: false, message: msg(locale, 'register.errors.fields') };
      console.error('mem.add failed', error.code, error.message);
      return { ok: false, message: msg(locale, 'register.errors.generic') };
    }
    const row = data?.[0];
    if (!row?.token) return { ok: false, message: msg(locale, 'register.errors.generic') };
    const sent = await sendInvitation({
      kind: 'company_user',
      to: d.email,
      name: d.owner,
      inviter: actor.access.full_name || 'MCCI',
      company: d.company,
      role: 'Owner',
      token: row.token,
    });
    revalidatePath('/[locale]/admin/members', 'page');
    return {
      ok: true,
      message: msg(locale, sent ? 'register.done.added' : 'register.done.addedNoEmail', { no: row.member_no, email: d.email }),
    };
  } catch (error) {
    if (error instanceof PermissionError) return { ok: false, message: msg(locale, 'register.errors.notAllowed') };
    throw error;
  }
}
