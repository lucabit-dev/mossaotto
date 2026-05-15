import { NextRequest, NextResponse } from 'next/server';
import { detectSource, getOEmbedUrl, parseOEmbedResult } from '@/lib/oembed';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const source = detectSource(url);
  const oembedUrl = getOEmbedUrl(url, source);

  if (!oembedUrl) {
    return NextResponse.json({ source, title: null, artist: null, artwork_url: null }, { status: 200 });
  }

  try {
    const res = await fetch(oembedUrl, { headers: { 'User-Agent': 'MossaOtto/1.0' }, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`oEmbed returned ${res.status}`);
    const data = await res.json();
    const parsed = parseOEmbedResult(data as Record<string, unknown>, source);
    return NextResponse.json({
      source,
      title: parsed.title ?? null,
      artist: parsed.artist ?? null,
      artwork_url: parsed.thumbnail_url ?? null,
    });
  } catch (e) {
    return NextResponse.json({ source, title: null, artist: null, artwork_url: null, error: String(e) }, { status: 200 });
  }
}
