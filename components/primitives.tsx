'use client';

// ScorePips — 5 small rounded rectangles, filled = accent
export function ScorePips({ value = 0, max = 5, size = 'md' }: { value?: number; max?: number; size?: 'sm' | 'md' }) {
  const d = size === 'sm' ? { w: 5, h: 9, g: 3 } : { w: 6, h: 12, g: 4 };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: d.g }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            width: d.w,
            height: d.h,
            borderRadius: 999,
            background: i < value ? 'var(--mo-accent)' : 'transparent',
            boxShadow: i < value ? 'none' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
            transition: 'all .14s',
          }}
        />
      ))}
    </div>
  );
}

// IntensityBars — 5 wedge bars of increasing height
export function IntensityBars({ value = 0, max = 5, size = 'md' }: { value?: number; max?: number; size?: 'sm' | 'md' }) {
  const d = size === 'sm' ? { w: 4, base: 5, step: 2, g: 2 } : { w: 5, base: 6, step: 3, g: 3 };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: d.g, height: d.base + d.step * (max - 1) }}>
      {Array.from({ length: max }, (_, i) => {
        const h = d.base + d.step * i;
        return (
          <span
            key={i}
            style={{
              width: d.w,
              height: h,
              borderRadius: 2,
              background: i < value ? 'var(--mo-accent)' : 'transparent',
              boxShadow: i < value ? 'none' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
              transition: 'all .14s',
            }}
          />
        );
      })}
    </div>
  );
}

// PositionDots — 3 dots, one lit (open=0, middle=1, close=2)
export function PositionDots({ value, size = 6 }: { value?: string | null; size?: number }) {
  const idx = value === 'open' ? 0 : value === 'middle' ? 1 : value === 'close' ? 2 : -1;
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: i === idx ? 'var(--mo-accent)' : 'transparent',
            boxShadow: i === idx ? 'none' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
            transition: 'all .14s',
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}

// SourceDot — 6px coloured dot
export function SourceDot({ src, size = 6 }: { src: string; size?: number }) {
  const c: Record<string, string> = {
    yt: 'var(--mo-src-yt)',
    sp: 'var(--mo-src-sp)',
    sc: 'var(--mo-src-sc)',
    bc: 'var(--mo-src-bc)',
  };
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: c[src] ?? 'var(--mo-text-3)',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}
