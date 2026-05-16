import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  try {
    const r = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`);
    if (!r.ok) return NextResponse.json({ title: null, artist: null, artwork: null });
    const data = await r.json();
    const entities = Object.values(data.entitiesByUniqueId ?? {}) as Record<string, unknown>[];
    const e = (entities.find(x => x?.title && x?.artistName) ?? entities[0]) as Record<string, unknown> | undefined;
    return NextResponse.json({
      title: e?.title ?? null,
      artist: e?.artistName ?? null,
      artwork: e?.thumbnailUrl ?? null,
    });
  } catch {
    return NextResponse.json({ title: null, artist: null, artwork: null });
  }
}
