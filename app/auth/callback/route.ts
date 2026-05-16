import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // On Vercel, request.url is the internal host; x-forwarded-host is the public domain.
      const forwardedHost = request.headers.get('x-forwarded-host');
      const redirectBase =
        forwardedHost && process.env.NODE_ENV === 'production'
          ? `https://${forwardedHost}`
          : origin;
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
