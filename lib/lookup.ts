export async function odesliLookup(url: string) {
  const r = await fetch(`/api/odesli?url=${encodeURIComponent(url)}`);
  if (!r.ok) return null;
  return r.json() as Promise<{ title: string | null; artist: string | null; artwork: string | null }>;
}

export async function bpmLookup(artist: string, title: string) {
  if (!artist || !title) return { bpm: null as number | null, key: null as string | null, source: null as string | null };
  const q = new URLSearchParams({ artist, title }).toString();
  const r = await fetch(`/api/lookup-bpm?${q}`);
  if (!r.ok) return { bpm: null as number | null, key: null as string | null, source: null as string | null };
  return r.json() as Promise<{ bpm: number | null; key: string | null; source: string | null }>;
}
