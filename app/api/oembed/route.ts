import { NextRequest, NextResponse } from 'next/server';
import { detectSource, getOEmbedUrl, parseOEmbedResult } from '@/lib/oembed';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const source = detectSource(url);
  const oembedUrl = getOEmbedUrl(url, source);

  // Run oEmbed and Odesli in parallel — Odesli fills artist for Spotify which oEmbed omits
  const [oembedSettled, odesliSettled] = await Promise.allSettled([
    oembedUrl
      ? fetch(oembedUrl, { headers: { 'User-Agent': 'MossaOtto/1.0' }, next: { revalidate: 3600 } })
          .then(r => (r.ok ? r.json() : null))
          .then((data: Record<string, unknown> | null) =>
            data ? parseOEmbedResult(data, source) : null
          )
      : Promise.resolve(null),
    fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`, {
      next: { revalidate: 3600 },
    })
      .then(r => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (!data) return null;
        const entities = Object.values(
          (data.entitiesByUniqueId as Record<string, unknown>) ?? {}
        ) as Record<string, unknown>[];
        const e = entities.find(x => x?.title && x?.artistName) ?? entities[0];
        return e
          ? {
              title: (e.title as string) ?? null,
              artist: (e.artistName as string) ?? null,
              artwork: (e.thumbnailUrl as string) ?? null,
            }
          : null;
      }),
  ]);

  const oembed = oembedSettled.status === 'fulfilled' ? oembedSettled.value : null;
  const odesli = odesliSettled.status === 'fulfilled' ? odesliSettled.value : null;

  // Odesli wins on artist/title; oEmbed thumbnail is usually higher-res
  return NextResponse.json({
    source,
    title: odesli?.title ?? oembed?.title ?? null,
    artist: odesli?.artist ?? oembed?.artist ?? null,
    artwork_url: oembed?.thumbnail_url ?? (odesli as { artwork?: string } | null)?.artwork ?? null,
  });
}
