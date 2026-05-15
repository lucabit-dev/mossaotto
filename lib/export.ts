import type { Track } from './types';

export function toSoulseekList(tracks: Track[]): string {
  return tracks
    .map(t => {
      if (t.artist && t.title) return `${t.artist} - ${t.title}`;
      if (t.title) return t.title;
      return t.url;
    })
    .join('\n');
}

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(tracks: Track[]): string {
  const headers = ['title', 'artist', 'genre', 'bpm', 'musical_key', 'intensity', 'score', 'set_position', 'downloaded', 'url', 'source', 'notes', 'added_by', 'created_at'];
  const rows = tracks.map(t => [
    escapeCsvField(t.title),
    escapeCsvField(t.artist),
    escapeCsvField(t.genre),
    escapeCsvField(t.bpm),
    escapeCsvField(t.musical_key),
    escapeCsvField(t.intensity),
    escapeCsvField(t.score),
    escapeCsvField(t.set_position.join('|')),
    escapeCsvField(t.downloaded),
    escapeCsvField(t.url),
    escapeCsvField(t.source),
    escapeCsvField(t.notes),
    escapeCsvField(t.added_by),
    escapeCsvField(t.created_at),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(tracks: Track[]) {
  const csv = toCSV(tracks);
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mossa-otto-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback for non-HTTPS contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
