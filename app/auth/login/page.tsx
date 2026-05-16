'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function LogoMark() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="6.5" stroke="var(--mo-text-1)" strokeWidth="1.2" fill="none" />
      <circle cx="13" cy="7" r="6.5" stroke="var(--mo-text-1)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (authError) setError(authError.message);
    else setSent(true);
  }

  return (
    <div
      style={{
        background: 'var(--mo-bg)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <LogoMark />
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.04em',
              color: 'var(--mo-text-1)',
            }}
          >
            MOSSA OTTO
          </span>
        </div>

        {sent ? (
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.028em',
                color: 'var(--mo-text-1)',
                marginBottom: 10,
              }}
            >
              Check your email.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--mo-text-2)', marginBottom: 32, lineHeight: 1.5 }}>
              Magic link sent to <strong style={{ color: 'var(--mo-text-1)' }}>{email}</strong>. Click it to sign in.
            </p>
            <hr style={{ border: 'none', borderTop: '1px solid var(--mo-hairline)', marginBottom: 16 }} />
            <p style={{ fontSize: 13, color: 'var(--mo-text-3)' }}>Don&apos;t see it? Check spam.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: '-0.028em',
                color: 'var(--mo-text-1)',
                marginBottom: 10,
              }}
            >
              Welcome back.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--mo-text-2)', marginBottom: 32, lineHeight: 1.5 }}>
              Sign in with a magic link. No password to remember.
            </p>

            <div style={{ marginBottom: 12, position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--mo-text-3)',
                  pointerEvents: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="2,4 12,13 22,4" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="you@example.com"
                required
                autoFocus
                style={{
                  width: '100%',
                  height: 48,
                  paddingLeft: 42,
                  paddingRight: 14,
                  borderRadius: 10,
                  background: 'var(--mo-bg-elev)',
                  border: 'none',
                  outline: 'none',
                  boxShadow: focused
                    ? '0 0 0 1px var(--mo-accent-ring), 0 0 0 4px var(--mo-accent-tint)'
                    : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                  fontSize: 15,
                  color: 'var(--mo-text-1)',
                  fontFamily: 'var(--mo-font-text)',
                  boxSizing: 'border-box',
                  transition: 'box-shadow .15s',
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--mo-danger)', marginBottom: 10 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 999,
                background: 'var(--mo-accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                border: 'none',
                cursor: loading || !email ? 'not-allowed' : 'pointer',
                opacity: loading || !email ? 0.55 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 28,
                transition: 'opacity .14s',
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                color: 'var(--mo-text-3)',
                marginBottom: 20,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Only the two of you have access.
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--mo-hairline)', marginBottom: 16 }} />
            <p style={{ fontSize: 12.5, color: 'var(--mo-text-3)' }}>Don&apos;t see it? Check spam.</p>
          </form>
        )}
      </div>
    </div>
  );
}
