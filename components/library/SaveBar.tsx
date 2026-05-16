'use client';

import { useState, useRef } from 'react';
import { detectSource, stripTrackingParams } from '@/lib/oembed';
import type { Track } from '@/lib/types';

interface SaveBarProps {
  existingTracks: Track[];
  onOpenNew: (url: string, source: string, title: string | null, artist: string | null, artworkUrl: string | null) => void;
  onOpenExisting: (track: Track) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function SaveBar({ existingTracks, onOpenNew, onOpenExisting, onToast }: SaveBarProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    const raw = url.trim();
    if (!raw) return;

    let cleaned: string;
    try {
      new URL(raw);
      cleaned = stripTrackingParams(raw);
    } catch {
      onToast('Invalid URL', 'err');
      return;
    }

    const existing = existingTracks.find(t => t.url === cleaned);
    if (existing) {
      onToast('Already in library — opening it', 'ok');
      onOpenExisting(existing);
      setUrl('');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(cleaned)}`);
      const data = await res.json() as { source: string; title: string | null; artist: string | null; artwork_url: string | null };
      onOpenNew(cleaned, data.source, data.title, data.artist, data.artwork_url);
      setUrl('');
    } catch {
      const source = detectSource(cleaned);
      onOpenNew(cleaned, source, null, null, null);
      setUrl('');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  const hasValue = url.trim().length > 0;

  const boxShadow = focused
    ? '0 0 0 1px var(--mo-accent-ring), 0 0 0 4px var(--mo-accent-tint), var(--mo-shadow-2)'
    : 'var(--mo-shadow-2), inset 0 0 0 1px var(--mo-hairline-strong)';

  return (
    <div style={{ padding: '20px 32px 14px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--mo-bg-elev)',
          borderRadius: 999,
          padding: '6px 6px 6px 18px',
          boxShadow,
          transition: 'box-shadow .15s',
        }}
      >
        {/* Link icon */}
        <span style={{ color: 'var(--mo-text-3)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste YouTube / Spotify / SoundCloud URL…"
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--mo-text-1)',
            fontFamily: hasValue ? 'var(--mo-font-mono)' : 'var(--mo-font-text)',
            minWidth: 0,
          }}
        />

        {/* Kbd hint */}
        {!hasValue && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0,
            }}
          >
            {['⌘', 'V'].map(k => (
              <kbd
                key={k}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 20,
                  minWidth: 20,
                  padding: '0 5px',
                  borderRadius: 5,
                  background: 'var(--mo-bg-sunken)',
                  boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--mo-text-3)',
                  fontFamily: 'var(--mo-font-text)',
                }}
              >
                {k}
              </kbd>
            ))}
          </span>
        )}

        {/* Add track button */}
        <button
          onClick={handleSave}
          disabled={loading || !hasValue}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 16px',
            borderRadius: 999,
            background: 'var(--mo-accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13.5,
            border: 'none',
            cursor: loading || !hasValue ? 'not-allowed' : 'pointer',
            opacity: loading || !hasValue ? 0.55 : 1,
            flexShrink: 0,
            transition: 'opacity .14s',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? (
            'Loading…'
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add track
            </>
          )}
        </button>
      </div>
    </div>
  );
}
