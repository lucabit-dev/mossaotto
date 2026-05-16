'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userEmail: string | null;
  dark: boolean;
  onToggleDark: () => void;
  search: string;
  onSearchChange: (v: string) => void;
}

function LogoMark() {
  return (
    <svg width="18" height="13" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="6.5" stroke="var(--mo-text-1)" strokeWidth="1.2" fill="none" />
      <circle cx="13" cy="7" r="6.5" stroke="var(--mo-text-1)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Header({ userEmail, dark, onToggleDark, search, onSearchChange }: HeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : '?';
  const displayEmail = userEmail
    ? userEmail.length > 22
      ? userEmail.slice(0, 20) + '…'
      : userEmail
    : '';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--mo-bg-vibrancy)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid var(--mo-hairline)',
        padding: '0 32px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <LogoMark />
        <span
          style={{
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.04em',
            color: 'var(--mo-text-1)',
          }}
        >
          MOSSA OTTO
        </span>
      </div>

      {/* Divider */}
      <span
        style={{
          width: 1,
          height: 16,
          background: 'var(--mo-hairline-strong)',
          flexShrink: 0,
        }}
      />

      {/* Library label */}
      <span
        style={{
          fontSize: 13.5,
          color: 'var(--mo-text-2)',
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        Library
      </span>

      {/* Universal search — centered in the header */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ position: 'relative', width: 'min(400px, 100%)' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--mo-text-3)', display: 'flex', pointerEvents: 'none',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search title, artist, genre…"
            style={{
              width: '100%', height: 32, paddingLeft: 32, paddingRight: search ? 32 : 80,
              borderRadius: 999,
              background: 'var(--mo-bg-elev)',
              border: 'none', outline: 'none',
              boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
              fontSize: 12.5, color: 'var(--mo-text-1)',
              fontFamily: 'var(--mo-font-text)',
              boxSizing: 'border-box' as const,
            }}
          />
          {search ? (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 18, height: 18, borderRadius: 999,
                background: 'var(--mo-text-3)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--mo-bg)', padding: 0,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : (
            <div style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: 2,
              pointerEvents: 'none',
            }}>
              {['⌘', 'K'].map(k => (
                <span key={k} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 18, minWidth: 18, padding: '0 4px', borderRadius: 4,
                  background: 'var(--mo-bg-sunken)',
                  boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                  fontSize: 10, fontWeight: 600, color: 'var(--mo-text-3)',
                }}>{k}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Partner online */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--mo-success)',
            boxShadow: '0 0 0 3px rgba(31,138,91,.20)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12.5, color: 'var(--mo-text-2)' }}>Partner online</span>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mo-text-2)',
          flexShrink: 0,
        }}
      >
        {dark ? (
          /* Sun icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          /* Moon icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* User avatar pill */}
      <button
        onClick={signOut}
        title="Sign out"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 6px 6px 12px',
          borderRadius: 999,
          background: 'var(--mo-bg-elev)',
          boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12.5, color: 'var(--mo-text-2)', fontWeight: 500 }}>{displayEmail}</span>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--mo-accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
      </button>
    </header>
  );
}
