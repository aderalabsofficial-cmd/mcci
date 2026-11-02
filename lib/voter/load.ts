import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** The voter list from a cutoff date (api.voter_list, 0590). The database applies MCCI's rules and gives each reason. */
export const VOTER_RESULTS = ['eligible', 'not_eligible', 'all'] as const;
export type VoterResult = (typeof VOTER_RESULTS)[number];

export interface VoterRow {
  member_id: string;
  member_no: string;
  company: string;
  class: string;
  women: boolean;
  rep_name: string;
  since: string | null;
  valid_to: string;
  restored_at: string | null;
  blacklisted: boolean;
  status: string;
  reason: string | null;
}

export async function loadVoterList(cutoff: string, cls: string | null): Promise<VoterRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema('api')
    .rpc('voter_list', { p_cutoff: cutoff, p_class: cls as string });
  if (error) throw new Error('voter list could not be read');
  return (data ?? []) as VoterRow[];
}

export const filterVoters = (rows: VoterRow[], result: VoterResult) =>
  result === 'all' ? rows : rows.filter((r) => (result === 'eligible' ? r.reason === null : r.reason !== null));
