import 'server-only';
import type { AppForm } from '@/lib/flow/application';
import { createClient } from '@/lib/supabase/server';

export { karachiToday } from '@/lib/committee/rules';

/**
 * Committee Desk and Meetings & Minutes (prototype admin/committee, admin/meetings). Read with the staff member's own
 * session: meetings and agenda items need cmt ≥ 1, applications mem ≥ 1 (docs/06; RLS of 0150/0170).
 */

export type MeetingStatus = 'Pending' | 'Approved';
export type Committee = 'Membership Committee' | 'Executive Committee' | 'General Body';
export const COMMITTEES: Committee[] = ['Membership Committee', 'Executive Committee', 'General Body'];

export interface Meeting {
  id: string;
  name: string;
  committee: Committee;
  held_on: string | null;
  status: MeetingStatus;
  minutes: string | null;
  open: number;
  decided: number;
}

export async function loadMeetings(): Promise<Meeting[]> {
  const supabase = await createClient();
  const [{ data: rows, error }, { data: items }] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, name, committee, held_on, status, minutes')
      .order('held_on', { ascending: false, nullsFirst: false }),
    supabase.from('committee_items').select('meeting_id, decision'),
  ]);
  if (error) throw new Error(`meetings: ${error.message}`);
  return (rows ?? []).map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    committee: m.committee as Committee,
    held_on: m.held_on,
    status: m.status as MeetingStatus,
    minutes: m.minutes,
    open: (items ?? []).filter((i) => i.meeting_id === m.id && !i.decision).length,
    decided: (items ?? []).filter((i) => i.meeting_id === m.id && i.decision).length,
  }));
}

export interface AppCommittee {
  items: {
    meeting: string;
    name: string;
    held_on: string | null;
    item: number | null;
    decision: string | null;
    note: string | null;
    decided_at: string | null;
  }[];
  member_no: string | null;
  voucher: { no: string; amount: number; status: string; due_at: string } | null;
}

/** the committee's record of one application, for Application Review */
export async function loadAppCommittee(appId: string): Promise<AppCommittee> {
  const supabase = await createClient();
  const [{ data: items }, { data: app }, { data: v }] = await Promise.all([
    supabase
      .from('committee_items')
      .select('meeting_id, item_no, decision, note, decided_at, meetings(name, held_on)')
      .eq('application_id', appId),
    supabase.from('applications').select('member_no').eq('id', appId).maybeSingle(),
    supabase
      .from('payment_vouchers')
      .select('voucher_no, amount, status, due_at')
      .eq('ref_type', 'membership')
      .eq('ref_id', appId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  return {
    items: (items ?? [])
      .map((i) => {
        const mt = i.meetings as unknown as { name: string | null; held_on: string | null } | null;
        return {
          meeting: i.meeting_id,
          name: mt?.name ?? i.meeting_id,
          held_on: mt?.held_on ?? null,
          item: i.item_no,
          decision: i.decision,
          note: i.note,
          decided_at: i.decided_at,
        };
      })
      .sort((a, b) => (a.held_on ?? '').localeCompare(b.held_on ?? '')),
    member_no: app?.member_no ?? null,
    voucher: v?.[0] ? { no: v[0].voucher_no, amount: v[0].amount, status: v[0].status, due_at: v[0].due_at } : null,
  };
}

// ───────── R2 (migration 0430): the committee in force, and every forwarded file ─────────

export interface CommitteePerson {
  id: string;
  name: string;
  designation?: string;
}

export interface Assignment {
  id: string;
  status: 'Approved' | 'Pending';
  convener: CommitteePerson;
  members: CommitteePerson[];
  note: string | null;
  proposedBy: string | null;
  proposedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface CommitteeNow {
  current: Assignment | null;
  pending: Assignment | null;
  meConvener: boolean;
  meMember: boolean;
}

/** the Membership Committee approved by the President, and the one the SG proposed that waits for the President */
export async function loadCommittee(): Promise<CommitteeNow> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema('api').rpc('cmt_committee');
  if (error) throw new Error(`cmt_committee: ${error.message}`);
  const as = (r: NonNullable<typeof data>[number]): Assignment => ({
    id: r.id,
    status: r.status as Assignment['status'],
    convener: { id: r.convener, name: r.convener_name },
    members: ((r.members ?? []) as unknown as { id: string; name: string; designation: string }[]).map((x) => ({
      id: x.id,
      name: x.name,
      designation: x.designation,
    })),
    note: r.note,
    proposedBy: r.proposed_by_name,
    proposedAt: r.proposed_at,
    decidedBy: r.decided_by_name,
    decidedAt: r.decided_at,
  });
  const cur = (data ?? []).find((r) => r.status === 'Approved');
  const pen = (data ?? []).find((r) => r.status === 'Pending');
  return {
    current: cur ? as(cur) : null,
    pending: pen ? as(pen) : null,
    meConvener: cur?.me_convener === true,
    meMember: cur?.me_convener === true || cur?.me_member === true,
  };
}

export interface ForwardedFile {
  appId: string;
  token: string;
  name: string;
  biz: string | null;
  cls: 'Corporate' | 'Associate' | null;
  women: boolean;
  memberNo: string | null;
  proposer: string | null;
  seconder: string | null;
  photo_path: string | null;
  forwardedAt: string | null;
  notes: { by: string | null; at: string; note: string | null }[];
  /** a test file of a demo applicant (0350/0405): shown marked */
  demo: boolean;
}

export interface Forwarded {
  files: ForwardedFile[];
  /** documents verified, both consents in, waiting for the officer to type the number and forward */
  ready: number;
  counts: { approved: number; returned: number; payment: number };
}

/** every file with the committee — no meeting or agenda needed (docs/21 point 24) */
export async function loadForwarded(): Promise<Forwarded> {
  const supabase = await createClient();
  const [{ data: apps, error }, { data: ends }, { data: hist }] = await Promise.all([
    supabase
      .from('applications')
      .select('id, token, stage, form, class, women, member_no, photo_path, companies(demo)')
      .in('stage', ['proposer', 'committee', 'payment', 'temp', 'permanent']),
    supabase.from('endorsements').select('application_id, role, status, members(rep_name)').eq('status', 'Approved'),
    supabase
      .from('application_history')
      .select('application_id, step, note, by_name, at')
      .in('step', ['forwarded', 'committee note', 'returned to officer'])
      .order('at', { ascending: false }),
  ]);
  if (error) throw new Error(`applications: ${error.message}`);
  const endorser = (app: string, role: string) =>
    ((ends ?? []).find((e) => e.application_id === app && e.role === role)?.members as unknown as {
      rep_name: string;
    } | null)?.rep_name ?? null;
  const consents = (app: string) => new Set((ends ?? []).filter((e) => e.application_id === app).map((e) => e.role)).size;
  const all = apps ?? [];
  const files = all
    .filter((a) => a.stage === 'committee')
    .map((a): ForwardedFile => {
      const f = (a.form ?? {}) as AppForm;
      const h = (hist ?? []).filter((x) => x.application_id === a.id);
      return {
        appId: a.id,
        token: a.token,
        name: f.name ?? '',
        biz: f.biz ?? null,
        cls: a.class,
        women: a.women,
        memberNo: a.member_no,
        proposer: endorser(a.id, 'proposer'),
        seconder: endorser(a.id, 'seconder'),
        photo_path: a.photo_path,
        forwardedAt: h.find((x) => x.step === 'forwarded')?.at ?? null,
        notes: h.filter((x) => x.step === 'committee note').map((x) => ({ by: x.by_name, at: x.at, note: x.note })),
        demo: (a.companies as unknown as { demo: boolean } | null)?.demo === true,
      };
    })
    .sort((x, y) => (x.forwardedAt ?? '').localeCompare(y.forwardedAt ?? ''));
  return {
    files,
    ready: all.filter((a) => a.stage === 'proposer' && consents(a.id) === 2).length,
    counts: {
      approved: all.filter((a) => ['payment', 'temp', 'permanent'].includes(a.stage)).length,
      returned: all.filter(
        (a) => a.stage === 'proposer' && (hist ?? []).some((x) => x.application_id === a.id && x.step === 'returned to officer'),
      ).length,
      payment: all.filter((a) => a.stage === 'payment').length,
    },
  };
}
