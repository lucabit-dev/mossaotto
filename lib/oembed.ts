import type { Source, OEmbedResult } from './types';

export function detectSource(url: string): Source {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, '');
    if (h === 'youtube.com' || h === 'youtu.be' || h === 'music.youtube.com') return 'youtube';
    if (h === 'open.spotify.com') return 'spotify';
    if (h === 'soundcloud.com') return 'soundcloud';
    if (h.endsWith('bandcamp.com')) return 'bandcamp';
    return 'other';
  } catch {
    return 'other';
  }
}

const TRACKING_PARAMS = ['si', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'feature', 'context', 'ref'];

export function stripTrackingParams(url: string): string {
  try {
    const u = new URL(url);
    TRACKING_PARAMS.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

export function getOEmbedUrl(url: string, source: Source): string | null {
  switch (source) {
    case 'youtube':
      return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    case 'soundcloud':
      return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    case 'spotify':
      return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    case 'bandcamp':
      return `https://bandcamp.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    default:
      return null;
  }
}

// YouTube title often has format "Artist - Title" or "Title (feat. X) - Artist"
const ARTIST_TITLE_RE = /^(.+?)\s+[-—–]\s+(.+)$/;

export function parseYouTubeTitle(title: string, authorName: string): { artist: string; title: string } {
  const m = title.match(ARTIST_TITLE_RE);
  if (m) {
    return { artist: m[1].trim(), title: m[2].trim() };
  }
  return { artist: authorName, title };
}

export function parseOEmbedResult(data: Record<string, unknown>, source: Source): Partial<OEmbedResult & { artist: string; title: string }> {
  const raw = {
    title: typeof data.title === 'string' ? data.title : undefined,
    author_name: typeof data.author_name === 'string' ? data.author_name : undefined,
    thumbnail_url: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined,
  };

  if (source === 'youtube' && raw.title) {
    const parsed = parseYouTubeTitle(raw.title, raw.author_name ?? '');
    return { ...raw, ...parsed };
  }

  return { ...raw, title: raw.title, artist: raw.author_name };
}

// TODO v1.1: integrate GetSongBPM.com API for automatic BPM detection
