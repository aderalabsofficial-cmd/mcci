import { describe, expect, it } from 'vitest';
import { dbErrorKey } from '@/lib/access/result';
import { invitationEmail, invitationLink } from '@/lib/invitations/email';
import { msg } from '@/lib/nav/model';

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe('database errors → bilingual messages (lib/access/result.ts)', () => {
  it('maps "not allowed" and every stable hint of migrations 0280/0290', () => {
    expect(dbErrorKey({ code: '42501' })).toBe('access.errors.notAllowed');
    for (const hint of ['already_staff', 'already_invited', 'already_member', 'invite_closed', 'self', 'sg_fixed']) {
      const key = dbErrorKey({ code: 'P0001', hint });
      expect(key).toBe(`access.errors.${hint}`);
      // the message exists in both languages
      expect(msg('en', key)).toBeTruthy();
      expect(msg('ur', key)).toBeTruthy();
    }
  });

  it('maps the keep-one-Owner trigger and hides anything unknown', () => {
    expect(dbErrorKey({ code: '23514', message: 'a company must keep at least one active Owner' })).toBe(
      'access.errors.lastOwner',
    );
    expect(dbErrorKey({ code: 'P0001', hint: 'something_new' })).toBe('access.errors.generic');
    expect(dbErrorKey({ code: 'XX000', message: 'internal detail' })).toBe('access.errors.generic');
  });
});

describe('invitation email (lib/invitations/email.ts)', () => {
  const base = { APP_URL: 'https://mcci.example/' };
  const token = 'A'.repeat(43);

  it('links to APP_URL/invite/<token>, never to a request host', () => {
    expect(invitationLink(token, env(base))).toBe(`https://mcci.example/invite/${token}`);
    expect(() => invitationLink(token, env({}))).toThrow(/APP_URL/);
  });

  it('carries English and Urdu, the role in both languages, and escapes user text in HTML', () => {
    const mail = invitationEmail(
      {
        kind: 'company_user',
        to: 'colleague@test.local',
        name: '<b>Ali</b>',
        inviter: 'Owner & Co',
        company: 'Acme "Traders"',
        role: 'Accounts',
        note: '<script>x</script>',
        token,
      },
      env(base),
    );
    expect(mail.to).toBe('colleague@test.local');
    expect(mail.subject).toContain('MCCI invitation');
    expect(mail.text).toContain(`https://mcci.example/invite/${token}`);
    expect(mail.text).toContain('as Accounts');
    expect(mail.text).toContain(msg('ur', 'access.roleNames.Accounts'));
    expect(mail.html).toContain('dir="rtl"');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>Ali</b>');
    expect(mail.html).toContain('&lt;b&gt;Ali&lt;/b&gt;');
    expect(mail.html).toContain('Owner &amp; Co');
  });

  it('staff invitations name the designation', () => {
    const mail = invitationEmail(
      { kind: 'staff', to: 'officer@test.local', name: null, inviter: 'SG', designation: 'Accounts Officer', token },
      env(base),
    );
    expect(mail.text).toContain('admin panel as Accounts Officer');
    expect(mail.text).toContain('Assalam-o-Alaikum officer@test.local');
  });
});
