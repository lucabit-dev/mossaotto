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
    <div className="flex gap-2">
      <button
        onClick={handleSoulseek}
        disabled={filtered.length === 0}
        className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-3 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Copy Artist - Title list for Soulseek"
      >
        Copy Soulseek list ({filtered.length})
      </button>
      <button
        onClick={handleCSV}
        disabled={filtered.length === 0}
        className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-3 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Export CSV
      </button>
    </div>
  );
}
