'use client';

import { toSoulseekList, downloadCSV, copyToClipboard } from '@/lib/export';
import type { Track } from '@/lib/types';

interface ExportButtonsProps {
  filtered: Track[];
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function ExportButtons({ filtered, onToast }: ExportButtonsProps) {
  async function handleSoulseek() {
    const text = toSoulseekList(filtered);
    const ok = await copyToClipboard(text);
    if (ok) onToast(`${filtered.length} tracks copied for Soulseek`, 'ok');
    else onToast('Failed to copy', 'err');
  }

  function handleCSV() {
    downloadCSV(filtered);
    onToast(`CSV exported (${filtered.length} tracks)`, 'ok');
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Soulseek — tinted */}
      <button
        onClick={handleSoulseek}
        disabled={filtered.length === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 32,
          padding: '0 12px',
          borderRadius: 999,
          background: 'var(--mo-accent-tint)',
          color: 'var(--mo-accent)',
          border: 'none',
          cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
          opacity: filtered.length === 0 ? 0.4 : 1,
          fontSize: 12.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
        title="Copy Artist - Title list for Soulseek"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Copy Soulseek list · {filtered.length}
      </button>

      {/* CSV — ghost */}
      <button
        onClick={handleCSV}
        disabled={filtered.length === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 32,
          padding: '0 12px',
          borderRadius: 999,
          background: 'transparent',
          color: 'var(--mo-text-2)',
          boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
          border: 'none',
          cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
          opacity: filtered.length === 0 ? 0.4 : 1,
          fontSize: 12.5,
          fontWeight: 500,
        }}
      >
        Export CSV
      </button>
    </div>
  );
}
