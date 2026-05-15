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
      // still open dialog with just the URL
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

  return (
    <div className="flex gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste YouTube / Spotify / SoundCloud URL…"
        autoFocus
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
      />
      <button
        onClick={handleSave}
        disabled={loading || !url.trim()}
        className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded text-sm transition-colors whitespace-nowrap"
      >
        {loading ? 'Loading…' : '+ Add track'}
      </button>
    </div>
  );
}
