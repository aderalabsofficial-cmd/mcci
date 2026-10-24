import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { safeNext } from '@/lib/auth/identifier';
import { createClient } from '@/lib/supabase/server';

const TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

/**
 * Landing point of every link Supabase Auth emails (sign-up confirmation, password reset, email change): turns the
 * link into a session cookie, then continues to `next` (same-site paths only). Accepts both the PKCE `code` that the
 * default email templates produce (works in the browser that asked for the email) and `token_hash` + `type` from
 * custom templates (works on any device). A failed or reused link goes to /login with a notice.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const base = process.env.APP_URL || url.origin;
  const next = safeNext(url.searchParams.get('next'), '/portal');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type && TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  const target = ok ? next : `/login?notice=link`;
  return NextResponse.redirect(new URL(target, base));
}
