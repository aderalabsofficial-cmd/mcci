import 'server-only';
import type { OfficialFormProps } from '@/components/membership/official-form';
import type { WizardApp } from '@/components/membership/wizard';
import type { BizType } from '@/lib/membership/reference';
import { createClient } from '@/lib/supabase/server';
import { type MyApplication, type PublicSettings, publicStorageUrl } from './load';

/** signed URLs (10 minutes) for many private files in one call; keyed by path */
export async function signedUrls(paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const list = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!list.length) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.storage.from('application-docs').createSignedUrls(list, 600);
  const out = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, publicStorageUrl(d.signedUrl));
  return out;
}

export async function wizardApp(app: MyApplication): Promise<WizardApp> {
  const urls = await signedUrls([...app.docs.map((d) => d.path), app.photo_path, app.sign_path, app.stamp_path]);
  return {
    id: app.id,
    token: app.token,
    form: app.form,
    field_confidence: app.field_confidence,
    jurisdiction_ok: app.jurisdiction_ok,
    women: app.women,
    decl1: app.decl1,
    decl2: app.decl2,
    photoUrl: app.photo_path ? (urls.get(app.photo_path) ?? null) : null,
    signUrl: app.sign_path ? (urls.get(app.sign_path) ?? null) : null,
    stampUrl: app.stamp_path ? (urls.get(app.stamp_path) ?? null) : null,
    sign: Boolean(app.sign_path),
    stamp: Boolean(app.stamp_path),
    docs: app.docs.map((d) => ({
      id: d.id,
      key: d.key,
      file_name: d.file_name,
      status: d.status,
      reject_reason: d.reject_reason,
      url: urls.get(d.path) ?? null,
    })),
    partners: app.partners,
    requirements: app.requirements,
  };
}

export function officialFormProps(
  app: MyApplication | null,
  w: WizardApp | null,
  settings: PublicSettings,
  docLists: Record<BizType, string[]>,
): OfficialFormProps {
  return {
    blank: !app,
    form: app?.form ?? {},
    partners: app?.partners ?? [],
    photo: w?.photoUrl ?? null,
    sign: w?.signUrl ?? null,
    stamp: w?.stampUrl ?? null,
    official: app?.class ? { cls: `${app.class}${app.women ? ' (Women Entrepreneur)' : ''}` } : {},
    chamber: settings.chamber,
    fees: settings.fees,
    processDays: settings.processDays,
    docLists,
  };
}
