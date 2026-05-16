import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist') ?? '';
  const title = req.nextUrl.searchParams.get('title') ?? '';

  if (!artist || !title) {
    return NextResponse.json({ bpm: null, key: null, source: null });
  }

  // Try Deezer first
  try {
    const q = `artist:"${artist}" track:"${title}"`;
    const searchRes = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json() as { data?: { id: number }[] };
      const trackId = searchData.data?.[0]?.id;
      if (trackId) {
        const trackRes = await fetch(`https://api.deezer.com/track/${trackId}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (trackRes.ok) {
          const track = await trackRes.json() as { bpm?: number };
          if (track.bpm && track.bpm > 0) {
            return NextResponse.json(
              { bpm: Math.round(track.bpm), key: null, source: 'deezer' },
              { headers: { 'Cache-Control': 'public, max-age=86400' } }
            );
          }
        }
      }
    }
  } catch { /* Deezer unavailable — fall through */ }

  // GetSongBPM fallback (only when API key is configured)
  const apiKey = process.env.GETSONGBPM_API_KEY;
  if (apiKey) {
    try {
      const lookup = `song:${title} artist:${artist}`;
      const url = `https://api.getsongbpm.com/search/?api_key=${apiKey}&type=both&lookup=${encodeURIComponent(lookup)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json() as { search?: { tempo?: string; key_of?: string }[] };
        const result = data.search?.[0];
        if (result?.tempo) {
          return NextResponse.json(
            { bpm: parseInt(result.tempo, 10), key: result.key_of ?? null, source: 'getsongbpm' },
            { headers: { 'Cache-Control': 'public, max-age=86400' } }
          );
        }
      }
    } catch { /* GetSongBPM unavailable */ }
  }

  return NextResponse.json({ bpm: null, key: null, source: null });
}
