import 'server-only';
import type { AppForm } from '@/lib/flow/application';
import { createClient } from '@/lib/supabase/server';

export { canDecideOn, karachiToday } from '@/lib/committee/rules';

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

export interface AgendaItem {
  appId: string;
  token: string;
  item: number | null;
  name: string;
  biz: string | null;
  cls: 'Corporate' | 'Associate' | null;
  women: boolean;
  proposer: string | null;
  seconder: string | null;
  photo_path: string | null;
  /** the committee's earlier deferral of this file, if any */
  deferred: { meeting: string; note: string | null } | null;
}

export interface Desk {
  meetings: Meeting[];
  /** the meeting shown: the one asked for, else the earliest pending Membership Committee meeting with open items */
  current: Meeting | null;
  agenda: AgendaItem[];
  /** with the committee but on no meeting yet (none scheduled) */
  waiting: AgendaItem[];
  counts: { approved: number; deferred: number; payment: number };
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

export async function loadDesk(meetingId?: string): Promise<Desk> {
  const supabase = await createClient();
  const meetings = (await loadMeetings()).filter((m) => m.committee === 'Membership Committee');
  const pending = meetings
    .filter((m) => m.status === 'Pending')
    .sort((a, b) => (a.held_on ?? '9999').localeCompare(b.held_on ?? '9999'));
  const current =
    meetings.find((m) => m.id === meetingId) ?? pending.find((m) => m.open > 0) ?? pending[0] ?? null;

  const [{ data: apps, error }, { data: items }, { data: ends }] = await Promise.all([
    supabase
      .from('applications')
      .select('id, token, stage, form, class, women, photo_path, companies!inner(demo)')
      .in('stage', ['committee', 'payment', 'temp', 'permanent'])
      // demo files (0350) never reach the committee's agenda or counts
      .eq('companies.demo', false),
    supabase.from('committee_items').select('application_id, meeting_id, item_no, decision, note, decided_at'),
    supabase
      .from('endorsements')
      .select('application_id, role, status, members(rep_name)')
      .eq('status', 'Approved'),
  ]);
  if (error) throw new Error(`applications: ${error.message}`);
  const its = items ?? [];
  const endorser = (app: string, role: string) =>
    ((ends ?? []).find((e) => e.application_id === app && e.role === role)?.members as unknown as {
      rep_name: string;
    } | null)?.rep_name ?? null;
  const toItem = (a: NonNullable<typeof apps>[number], item: number | null): AgendaItem => {
    const f = (a.form ?? {}) as AppForm;
    const d = its
      .filter((i) => i.application_id === a.id && i.decision === 'Deferred')
      .sort((x, y) => (y.decided_at ?? '').localeCompare(x.decided_at ?? ''))[0];
    return {
      appId: a.id,
      token: a.token,
      item,
      name: f.name ?? '',
      biz: f.biz ?? null,
      cls: a.class,
      women: a.women,
      proposer: endorser(a.id, 'proposer'),
      seconder: endorser(a.id, 'seconder'),
      photo_path: a.photo_path,
      deferred: d ? { meeting: d.meeting_id, note: d.note } : null,
    };
  };
  const inCommittee = (apps ?? []).filter((a) => a.stage === 'committee');
  const agenda = current
    ? its
        .filter((i) => i.meeting_id === current.id && !i.decision)
        .sort((x, y) => (x.item_no ?? 0) - (y.item_no ?? 0))
        .flatMap((i) => {
          const a = inCommittee.find((x) => x.id === i.application_id);
          return a ? [toItem(a, i.item_no)] : [];
        })
    : [];
  const waiting = inCommittee
    .filter((a) => !its.some((i) => i.application_id === a.id && !i.decision))
    .map((a) => toItem(a, null));
  return {
    meetings,
    current,
    agenda,
    waiting,
    counts: {
      approved: (apps ?? []).filter((a) => a.stage !== 'committee').length,
      deferred: inCommittee.filter((a) => its.some((i) => i.application_id === a.id && i.decision === 'Deferred')).length,
      payment: (apps ?? []).filter((a) => a.stage === 'payment').length,
    },
  };
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
