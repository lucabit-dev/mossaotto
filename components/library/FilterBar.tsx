'use client';

import { useState, useEffect, useRef } from 'react';
import type { FilterState, SetPosition, SortKey } from '@/lib/types';

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  genreOptions: string[];
  shown: number;
  total: number;
  queue: number;
}

// Segmented control
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: React.ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        borderRadius: 999,
        background: 'var(--mo-bg-sunken)',
        boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
      }}
    >
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--mo-bg-elev)' : 'transparent',
              boxShadow: active
                ? '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--mo-hairline-strong)'
                : 'none',
              color: active ? 'var(--mo-text-1)' : 'var(--mo-text-2)',
              fontWeight: 600,
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all .12s',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: active ? 'var(--mo-text-2)' : 'var(--mo-text-3)',
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FilterBar({ filters, onChange, genreOptions, shown: _shown, total, queue }: FilterBarProps) {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    if (showMore) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  const isDefault =
    filters.status === 'all' &&
    filters.source === 'all' &&
    filters.setPosition.length === 0 &&
    filters.minIntensity === null &&
    filters.minScore === null &&
    filters.genre === '';

  const advancedCount =
    (filters.minIntensity !== null ? 1 : 0) +
    (filters.minScore !== null ? 1 : 0) +
    (filters.genre !== '' ? 1 : 0);

  return (
    <div style={{ padding: '0 32px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {/* Status segmented */}
      <Segmented
        value={filters.status}
        onChange={v => onChange({ status: v })}
        options={[
          { value: 'all' as const, label: 'All', count: total },
          { value: 'queue' as const, label: 'Queue', count: queue },
          { value: 'downloaded' as const, label: 'Downloaded', count: total - queue },
        ]}
      />

      <span style={{ width: 1, height: 16, background: 'var(--mo-hairline-strong)', flexShrink: 0 }} />

      {/* Source chips — labeled with colored dot */}
      {(['youtube', 'spotify', 'soundcloud', 'bandcamp'] as const).map(src => {
        const labels: Record<string, string> = { youtube: 'YT', spotify: 'SP', soundcloud: 'SC', bandcamp: 'BC' };
        const dots: Record<string, string> = {
          youtube: 'var(--mo-src-yt)',
          spotify: 'var(--mo-src-sp)',
          soundcloud: 'var(--mo-src-sc)',
          bandcamp: 'var(--mo-src-bc)',
        };
        const active = filters.source === src;
        return (
          <button
            key={src}
            onClick={() => onChange({ source: active ? 'all' : src })}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--mo-accent-tint)' : 'transparent',
              color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
              boxShadow: `inset 0 0 0 1px ${active ? 'var(--mo-accent-ring)' : 'var(--mo-hairline-strong)'}`,
              fontWeight: 500,
              fontSize: 13,
              fontFamily: 'var(--mo-font-text)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all .12s',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dots[src], flexShrink: 0 }} />
            {labels[src]}
          </button>
        );
      })}

      <span style={{ width: 1, height: 16, background: 'var(--mo-hairline-strong)', flexShrink: 0 }} />

      {/* Position chips */}
      {(['open', 'middle', 'close'] as SetPosition[]).map(pos => {
        const active = filters.setPosition.includes(pos);
        const idx = ({ open: 0, middle: 1, close: 2 } as Record<string, number>)[pos];
        return (
          <button
            key={pos}
            onClick={() => {
              const cur = filters.setPosition;
              onChange({ setPosition: cur.includes(pos) ? cur.filter(x => x !== pos) : [...cur, pos] });
            }}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--mo-accent-tint)' : 'transparent',
              color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
              boxShadow: `inset 0 0 0 1px ${active ? 'var(--mo-accent-ring)' : 'var(--mo-hairline-strong)'}`,
              fontWeight: 500,
              fontSize: 13,
              fontFamily: 'var(--mo-font-text)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all .12s',
              textTransform: 'capitalize',
            }}
          >
            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: i === idx ? (active ? 'var(--mo-accent)' : 'var(--mo-text-2)') : 'transparent',
                    boxShadow: i !== idx ? 'inset 0 0 0 1px var(--mo-hairline-strong)' : 'none',
                  }}
                />
              ))}
            </span>
            {pos}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* "More filters" button with popover */}
      <div ref={moreRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMore(p => !p)}
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            background: advancedCount > 0 ? 'var(--mo-accent-tint)' : 'transparent',
            color: advancedCount > 0 ? 'var(--mo-accent)' : 'var(--mo-text-2)',
            boxShadow: advancedCount > 0 ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'none',
            fontWeight: 500,
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          More filters
          {advancedCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
              background: 'var(--mo-accent)', color: '#fff',
              fontSize: 11, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {advancedCount}
            </span>
          )}
        </button>

        {/* Popover */}
        {showMore && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 200,
            background: 'var(--mo-bg-elev)',
            borderRadius: 14,
            boxShadow: 'var(--mo-shadow-2), inset 0 0 0 1px var(--mo-hairline-strong)',
            padding: 16,
            minWidth: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            {/* Intensity ≥ */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <span className="mo-eyebrow">Intensity ≥</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([null, 1, 2, 3, 4, 5] as (number | null)[]).map(v => {
                  const active = filters.minIntensity === v;
                  return (
                    <button key={String(v)} onClick={() => onChange({ minIntensity: v })}
                      style={{
                        flex: 1, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: active ? 'var(--mo-accent-tint)' : 'var(--mo-bg-sunken)',
                        color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
                        boxShadow: active ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                        fontSize: 12.5, fontWeight: active ? 700 : 500,
                        transition: 'all .12s',
                      }}>
                      {v === null ? 'Any' : v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score ≥ */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <span className="mo-eyebrow">Score ≥</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([null, 1, 2, 3, 4, 5] as (number | null)[]).map(v => {
                  const active = filters.minScore === v;
                  return (
                    <button key={String(v)} onClick={() => onChange({ minScore: v })}
                      style={{
                        flex: 1, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: active ? 'var(--mo-accent-tint)' : 'var(--mo-bg-sunken)',
                        color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
                        boxShadow: active ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                        fontSize: 12.5, fontWeight: active ? 700 : 500,
                        transition: 'all .12s',
                      }}>
                      {v === null ? 'Any' : v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genre */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <span className="mo-eyebrow">Genre</span>
              </div>
              <input
                value={filters.genre}
                onChange={e => onChange({ genre: e.target.value })}
                placeholder="e.g. Techno"
                list="filterbar-genre-list"
                style={{
                  width: '100%', height: 34, padding: '0 12px',
                  borderRadius: 8, background: 'var(--mo-bg-sunken)', border: 'none', outline: 'none',
                  boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                  fontSize: 13, color: 'var(--mo-text-1)', boxSizing: 'border-box' as const,
                }}
              />
              <datalist id="filterbar-genre-list">
                {genreOptions.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>
        )}
      </div>

      {/* Sort */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 10px 0 12px',
            borderRadius: 999,
            background: 'var(--mo-bg-elev)',
            boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
            position: 'relative',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mo-text-3)" strokeWidth="1.8">
            <path d="M11 5H4M16 9H4M20 13H4M14 17H4" />
          </svg>
          <select
            value={filters.sort}
            onChange={e => onChange({ sort: e.target.value as SortKey })}
            style={{
              appearance: 'none' as const,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--mo-text-1)',
              cursor: 'pointer',
              paddingRight: 18,
            }}
          >
            {[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'score_desc', label: 'Score ↓' },
              { value: 'intensity_desc', label: 'Intensity ↓' },
              { value: 'bpm_asc', label: 'BPM ↑' },
              { value: 'bpm_desc', label: 'BPM ↓' },
              { value: 'title_az', label: 'Title A–Z' },
            ].map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mo-text-3)"
            strokeWidth="2"
            style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Clear — only when non-default */}
      {!isDefault && (
        <button
          onClick={() =>
            onChange({
              status: 'all',
              source: 'all',
              setPosition: [],
              minIntensity: null,
              minScore: null,
              genre: '',
              sort: 'newest',
            })
          }
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            background: 'var(--mo-accent-tint)',
            color: 'var(--mo-accent)',
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: 'var(--mo-font-text)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
