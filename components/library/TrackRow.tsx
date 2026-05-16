'use client';

import { useState, useEffect, useRef } from 'react';
import type { Track } from '@/lib/types';
import { PositionDots, IntensityBars, ScorePips } from '@/components/primitives';

interface TrackRowProps {
  track: Track;
  onClick: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

const SRC_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
};

const SRC_VAR: Record<string, string> = {
  youtube: 'var(--mo-src-yt)',
  spotify: 'var(--mo-src-sp)',
  soundcloud: 'var(--mo-src-sc)',
  bandcamp: 'var(--mo-src-bc)',
};

const SOURCE_CODE: Record<string, string> = {
  youtube: 'yt',
  spotify: 'sp',
  soundcloud: 'sc',
  bandcamp: 'bc',
};

const GRID = '28px 48px 1fr 90px 120px 110px 110px 36px';

export function TrackRowHeaders() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        alignItems: 'center',
        gap: 14,
        height: 34,
        padding: '0 16px',
        borderTop: '1px solid var(--mo-hairline)',
      }}
    >
      <span className="mo-eyebrow" />
      <span className="mo-eyebrow" />
      <span className="mo-eyebrow">Track</span>
      <span className="mo-eyebrow">Source</span>
      <span className="mo-eyebrow">Position</span>
      <span className="mo-eyebrow">Intensity</span>
      <span className="mo-eyebrow">Score</span>
      <span className="mo-eyebrow" />
    </div>
  );
}

export function TrackRow({ track, onClick: onEdit, selected, onSelect }: TrackRowProps) {
  const [hovered, setHovered] = useState(false);
  const [justArrived, setJustArrived] = useState(false);

  // Reflect downloaded from track prop
  const downloaded = track.downloaded;
  const prevDownloaded = useRef(track.downloaded);
  useEffect(() => {
    prevDownloaded.current = track.downloaded;
  }, [track.downloaded]);

  useEffect(() => {
    const age = Date.now() - new Date(track.created_at).getTime();
    if (age < 3000) {
      setJustArrived(true);
      const t = setTimeout(() => setJustArrived(false), 2200);
      return () => clearTimeout(t);
    }
  }, [track.created_at]);

  const srcCode = SOURCE_CODE[track.source] ?? 'yt';
  const dim = downloaded ? 0.7 : 1;
  const position = track.set_position[0] ?? null;

  const rowBg = justArrived
    ? 'var(--mo-accent-tint)'
    : selected
    ? 'var(--mo-accent-tint)'
    : hovered
    ? 'var(--mo-bg-hover)'
    : 'transparent';

  const metaParts = [
    track.artist,
    track.genre,
    track.bpm ? `${track.bpm} BPM` : null,
    track.musical_key,
  ].filter(Boolean) as string[];

  return (
    <div
      onClick={() => window.open(track.url, '_blank', 'noopener,noreferrer')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        alignItems: 'center',
        gap: 14,
        height: 60,
        padding: '0 16px',
        borderRadius: 12,
        background: rowBg,
        cursor: 'pointer',
        transition: 'background .15s',
        position: 'relative',
        animation: justArrived ? 'mo-enter 0.3s cubic-bezier(.2,.8,.4,1)' : undefined,
        boxShadow: selected ? 'inset 0 0 0 1px var(--mo-accent-ring)' : undefined,
      }}
    >
      {/* Accent rail when freshly added */}
      {justArrived && (
        <span
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 24,
            borderRadius: 999,
            background: 'var(--mo-accent)',
          }}
        />
      )}

      {/* Col 1: Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <label
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(track.id, e.target.checked)}
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          />
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: selected ? 'var(--mo-accent-tint)' : 'transparent',
              boxShadow: selected
                ? 'inset 0 0 0 1px var(--mo-accent)'
                : 'inset 0 0 0 1px var(--mo-hairline-strong)',
              transition: 'all .12s',
            }}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--mo-accent)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* Col 2: Source tile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'var(--mo-bg-sunken)',
            boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mo-text-3)" strokeWidth="1.6">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 11,
              height: 11,
              borderRadius: '50%',
              background:
                srcCode === 'yt'
                  ? 'var(--mo-src-yt)'
                  : srcCode === 'sp'
                  ? 'var(--mo-src-sp)'
                  : srcCode === 'sc'
                  ? 'var(--mo-src-sc)'
                  : 'var(--mo-src-bc)',
              boxShadow: '0 0 0 2px var(--mo-bg)',
            }}
          />
        </div>
      </div>

      {/* Col 3: Track — title + subtitle */}
      <div style={{ minWidth: 0, opacity: dim, transition: 'opacity 0.25s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: '-0.012em',
              color: 'var(--mo-text-1)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {track.title ?? '—'}
          </span>
          {downloaded && (
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 999,
                flexShrink: 0,
                background: 'rgba(31,138,91,.10)',
                boxShadow: 'inset 0 0 0 1px rgba(31,138,91,.28)',
                color: 'var(--mo-success)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Downloaded
            </span>
          )}
          {justArrived && (
            <span
              style={{
                padding: '1px 7px',
                borderRadius: 999,
                flexShrink: 0,
                background: 'var(--mo-accent)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              New
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--mo-text-2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {metaParts.join(' · ')}
        </div>
      </div>

      {/* Col 4: Source */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dim, transition: 'opacity 0.25s' }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            background: SRC_VAR[track.source] ?? 'var(--mo-text-3)',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: 'var(--mo-text-2)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {SRC_LABEL[track.source] ?? track.source}
        </span>
      </div>

      {/* Col 5: Position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: dim, transition: 'opacity 0.25s' }}>
        <PositionDots value={position} size={6} />
        {position && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--mo-text-2)',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {position}
          </span>
        )}
      </div>

      {/* Col 6: Intensity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IntensityBars value={track.intensity ?? 0} size="md" />
        {track.intensity && (
          <span className="mo-mono" style={{ fontSize: 11.5, color: 'var(--mo-text-3)' }}>
            {track.intensity}
          </span>
        )}
      </div>

      {/* Col 7: Score */}
      <div>
        <ScorePips value={track.score ?? 0} size="md" />
      </div>

      {/* Col 8: Edit button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mo-text-3)',
          }}
          title="Edit track"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
