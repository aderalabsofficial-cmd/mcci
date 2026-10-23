import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { must } from './fixtures';
import { readLocalEnv } from './local-env';
import { jwtClaims, readSqlHook, Synthetic, uuidParam, type User } from './synthetic';

/**
 * Storage API S1–S12 (docs/17 §11) through the gateway against the pinned Storage service and the object policies of
 * migration 0230. Synthetic companies, applications, vouchers and files only; every object is removed with the service
 * role at the end and teardown checks that nothing is left. Every denial has a positive control in the same test, so
 * a denial cannot come from a broken path or a missing bucket.
 */
const env = readLocalEnv();
const sql = readSqlHook();

let w: Synthetic;
let ownerA: User;
let servicesA: User;
let ownerB: User;
let ownerE: User;
let companyA: string;
let companyB: string;
let appDraft: string;
let appSubmitted: string;
let appB: string;
let vUnpaid: string;
let vPaid: string;

const pdf = (label: string) => Buffer.from(`%PDF-1.4\n% MCCI integration test ${label} ${randomUUID()}\n%%EOF\n`);
const sha = (b: ArrayBuffer | Buffer) =>
  createHash('sha256')
    .update(Buffer.from(b as ArrayBuffer))
    .digest('hex');
const appPath = (company: string, app: string) => `${company}/applications/${app}/${randomUUID()}.pdf`;

async function upload(user: User | null, bucket: string, path: string, body: Buffer, contentType = 'application/pdf') {
  const client = user ? user.client : w.anon;
  const res = await client.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (!res.error) w.object(bucket, path);
  return res;
}

beforeAll(async () => {
  if (!env) return;
  w = new Synthetic(env);
  ownerA = await w.user('s-owner-a');
  servicesA = await w.user('s-services-a');
  ownerB = await w.user('s-owner-b');
  ownerE = await w.user('s-owner-e');
  companyA = await w.company('A', [
    { user: ownerA, role: 'Owner' },
    { user: servicesA, role: 'Services' },
  ]);
  companyB = await w.company('B', [{ user: ownerB, role: 'Owner' }]);
  const companyE = await w.company('E', [{ user: ownerE, role: 'Owner' }]);
  appDraft = await w.application(companyA, ownerA, 'draft');
  appSubmitted = await w.application(companyA, ownerA, 'submitted');
  appB = await w.application(companyB, ownerB, 'draft');
  vUnpaid = await w.voucher(companyA, appDraft, 'Unpaid');
  vPaid = await w.voucher(companyA, appDraft, 'Paid');
  // company E endorses A's application: it must still not reach A's files (docs/04 AC 6)
  const memberE = randomUUID();
  must(
    await w.service.from('members').insert({
      id: memberE,
      member_no: `MCCI-IT-${w.run}`,
      company_id: companyE,
      class: 'Corporate',
      status: 'Permanent',
      rep_name: `IT ${w.run} E`,
      since: '2020-04-01',
      valid_to: '2099-03-31',
    }),
    'member',
  );
  must(
    await w.service.from('endorsements').insert({
      application_id: appDraft,
      role: 'proposer',
      endorser_member_id: memberE,
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    }),
    'endorsement',
  );
}, 120_000);

afterAll(async () => {
  if (w) await w.teardown();
}, 120_000);

describe.skipIf(!env)('Storage API S1–S12', () => {
  it('S1: an applicant uploads to its own draft application path; the object is readable by its owner', async () => {
    const path = appPath(companyA, appDraft);
    const body = pdf('s1');
    const res = await upload(ownerA, 'application-docs', path, body);
    expect(res.error).toBeNull();
    const back = await ownerA.client.storage.from('application-docs').download(path);
    expect(back.error).toBeNull();
    expect(sha(await back.data!.arrayBuffer())).toBe(sha(body));
  });

  it.skipIf(!sql)('S1: the stored object records the uploading user as owner', async () => {
    const path = appPath(companyA, appDraft);
    expect((await upload(ownerA, 'application-docs', path, pdf('s1-owner'))).error).toBeNull();
    expect(path).toMatch(/^[0-9a-f-]{36}\/applications\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/); // only uuids and separators reach the SQL text
    const id = sql!(
      `select owner_id from storage.objects where bucket_id = 'application-docs' and name = '${path}' and ` +
        `split_part(name, '/', 1)::uuid = ${uuidParam(companyA)};`,
    );
    expect(id).toBe(ownerA.id);
  });

  it("S2: another company's prefix is denied (upload and download)", async () => {
    const own = appPath(companyA, appDraft);
    expect((await upload(ownerA, 'application-docs', own, pdf('s2-control'))).error).toBeNull(); // control
    expect((await upload(ownerA, 'application-docs', appPath(companyB, appB), pdf('s2'))).error).not.toBeNull();
    // own company prefix but another company's application
    expect((await upload(ownerA, 'application-docs', appPath(companyA, appB), pdf('s2b'))).error).not.toBeNull();
    expect((await ownerB.client.storage.from('application-docs').download(own)).error).not.toBeNull();
  });

  it('S3: uploads stop once the application is submitted', async () => {
    expect((await upload(ownerA, 'application-docs', appPath(companyA, appSubmitted), pdf('s3'))).error).not.toBeNull();
    const app = await w.application(companyA, ownerA, 'draft');
    expect((await upload(ownerA, 'application-docs', appPath(companyA, app), pdf('s3-control'))).error).toBeNull();
    must(await w.service.from('applications').update({ stage: 'submitted' }).eq('id', app), 'submit');
    expect((await upload(ownerA, 'application-docs', appPath(companyA, app), pdf('s3-after'))).error).not.toBeNull();
  });

  it('S4: files over 10 MiB and disallowed types are rejected', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1, 0x20);
    big.write('%PDF-1.4\n');
    expect((await upload(ownerA, 'application-docs', appPath(companyA, appDraft), big)).error).not.toBeNull();
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    const htmlPath = `${companyA}/applications/${appDraft}/${randomUUID()}.html`;
    expect((await upload(ownerA, 'application-docs', htmlPath, html, 'text/html')).error).not.toBeNull();
    // control: an allowed type within the limit on the same path prefix
    expect((await upload(ownerA, 'application-docs', appPath(companyA, appDraft), pdf('s4'))).error).toBeNull();
  });

  it('S5: signed URLs: 600 s for the owner, useless after expiry, not issued to another company', async () => {
    const path = appPath(companyA, appDraft);
    const body = pdf('s5');
    expect((await upload(ownerA, 'application-docs', path, body)).error).toBeNull();
    const signed = await ownerA.client.storage.from('application-docs').createSignedUrl(path, 600);
    expect(signed.error).toBeNull();
    const token = new URL(signed.data!.signedUrl).searchParams.get('token')!;
    const claims = jwtClaims(token) as { exp: number; iat: number };
    expect(claims.exp - claims.iat).toBe(600);
    const ok = await fetch(signed.data!.signedUrl);
    expect(ok.status).toBe(200);
    expect(sha(await ok.arrayBuffer())).toBe(sha(body));

    const short = await ownerA.client.storage.from('application-docs').createSignedUrl(path, 1);
    expect(short.error).toBeNull();
    await new Promise((r) => setTimeout(r, 2_500));
    const expired = await fetch(short.data!.signedUrl);
    expect(expired.status).toBeGreaterThanOrEqual(400);
    await expired.arrayBuffer();

    expect((await ownerB.client.storage.from('application-docs').createSignedUrl(path, 600)).error).not.toBeNull();
  });

  it('S6: private objects need authentication; the cms bucket is public', async () => {
    const path = appPath(companyA, appDraft);
    expect((await upload(ownerA, 'application-docs', path, pdf('s6'))).error).toBeNull();
    expect((await w.anon.storage.from('application-docs').download(path)).error).not.toBeNull();
    const noKey = await fetch(`${env!.url}/storage/v1/object/authenticated/application-docs/${path}`);
    expect(noKey.status).toBeGreaterThanOrEqual(400);
    await noKey.arrayBuffer();
    const viaPublic = await fetch(`${env!.url}/storage/v1/object/public/application-docs/${path}`);
    expect(viaPublic.status).toBeGreaterThanOrEqual(400);
    await viaPublic.arrayBuffer();

    // cms: published site images, written by staff (here: the service role), readable by anyone without a key
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );
    const cmsPath = `it-${w.run}/${randomUUID()}.png`;
    const put = await w.service.storage.from('cms').upload(cmsPath, png, { contentType: 'image/png' });
    expect(put.error).toBeNull();
    w.object('cms', cmsPath);
    const pub = await fetch(`${env!.url}/storage/v1/object/public/cms/${cmsPath}`);
    expect(pub.status).toBe(200);
    expect(sha(await pub.arrayBuffer())).toBe(sha(png));
  });

  it('S7: clients cannot delete objects; the object stays', async () => {
    const path = appPath(companyA, appDraft);
    expect((await upload(ownerA, 'application-docs', path, pdf('s7'))).error).toBeNull();
    const removed = await ownerA.client.storage.from('application-docs').remove([path]);
    // Storage reports what it deleted; under RLS that is nothing
    expect(removed.data ?? []).toEqual([]);
    expect((await w.service.storage.from('application-docs').download(path)).error).toBeNull();
    expect((await ownerA.client.storage.from('application-docs').download(path)).error).toBeNull();
  });

  it('S8: overwriting an object (x-upsert) is denied; the content is unchanged', async () => {
    const path = appPath(companyA, appDraft);
    const body = pdf('s8');
    expect((await upload(ownerA, 'application-docs', path, body)).error).toBeNull();
    const over = await ownerA.client.storage
      .from('application-docs')
      .upload(path, pdf('s8-replacement'), { contentType: 'application/pdf', upsert: true });
    expect(over.error).not.toBeNull();
    const back = await w.service.storage.from('application-docs').download(path);
    expect(sha(await back.data!.arrayBuffer())).toBe(sha(body));
  });

  it("S9: an endorser cannot read the applicant's files", async () => {
    const path = appPath(companyA, appDraft);
    expect((await upload(ownerA, 'application-docs', path, pdf('s9'))).error).toBeNull();
    expect((await ownerE.client.storage.from('application-docs').download(path)).error).not.toBeNull();
    expect((await ownerE.client.storage.from('application-docs').createSignedUrl(path, 60)).error).not.toBeNull();
    const listed = await ownerE.client.storage.from('application-docs').list(`${companyA}/applications/${appDraft}`);
    expect(listed.data ?? []).toEqual([]);
    // control: the applicant lists its own folder
    const own = await ownerA.client.storage.from('application-docs').list(`${companyA}/applications/${appDraft}`);
    expect((own.data ?? []).length).toBeGreaterThan(0);
  });

  it('S10: a receipt can be uploaded only for an Unpaid voucher, by a user with payment rights', async () => {
    const receipt = (v: string) => `${companyA}/vouchers/${v}/${randomUUID()}.pdf`;
    expect((await upload(ownerA, 'receipts', receipt(vUnpaid), pdf('s10'))).error).toBeNull(); // control
    expect((await upload(ownerA, 'receipts', receipt(vPaid), pdf('s10-paid'))).error).not.toBeNull();
    expect((await upload(servicesA, 'receipts', receipt(vUnpaid), pdf('s10-services'))).error).not.toBeNull();
    expect((await upload(ownerB, 'receipts', receipt(vUnpaid), pdf('s10-other'))).error).not.toBeNull();
  });

  it('S11: an anonymous client cannot list private buckets or their objects', async () => {
    const buckets = await w.anon.storage.listBuckets();
    const names = (buckets.data ?? []).map((b) => b.name);
    for (const b of ['application-docs', 'form-snapshots', 'receipts', 'certificates', 'service-docs', 'imports']) {
      expect(names).not.toContain(b);
    }
    const path = appPath(companyA, appDraft);
    expect((await upload(ownerA, 'application-docs', path, pdf('s11'))).error).toBeNull();
    const anonList = await w.anon.storage.from('application-docs').list(`${companyA}/applications/${appDraft}`);
    expect(anonList.data ?? []).toEqual([]);
    // control: the service role sees the private buckets and the object
    const all = (await w.service.storage.listBuckets()).data!.map((b) => b.name);
    expect(all).toContain('application-docs');
  });

  it('S12: only the trusted service-role handler writes form snapshots; the applicant can read them', async () => {
    const path = appPath(companyA, appDraft);
    const body = pdf('s12');
    const put = await w.service.storage.from('form-snapshots').upload(path, body, { contentType: 'application/pdf' });
    expect(put.error).toBeNull();
    w.object('form-snapshots', path);
    const back = await ownerA.client.storage.from('form-snapshots').download(path);
    expect(back.error).toBeNull();
    expect(sha(await back.data!.arrayBuffer())).toBe(sha(body));
    expect(
      (await upload(ownerA, 'form-snapshots', appPath(companyA, appDraft), pdf('s12-client'))).error,
    ).not.toBeNull();
    expect((await ownerB.client.storage.from('form-snapshots').download(path)).error).not.toBeNull();
  });

  it('D-M24: the S3 protocol endpoint is switched off (S3_PROTOCOL_ENABLED=false)', async () => {
    // With the endpoint on, Storage answers an S3 AccessDenied XML error (SigV4 keys bypass RLS). Off, the route
    // does not exist.
    const res = await fetch(`${env!.url}/storage/v1/s3/`);
    const text = await res.text();
    expect(text).not.toMatch(/AccessDenied|SignatureDoesNotMatch|amazonaws/);
    expect(res.status).toBe(404);
  });
});
