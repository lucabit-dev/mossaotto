'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';
import { PositionDots, IntensityBars, ScorePips } from '@/components/primitives';

interface TrackRowProps {
  track: Track;
  onClick: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
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

const GRID = '28px 48px 1fr 96px 120px 110px 110px 36px';

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

export function TrackRow({ track, onClick, onToast }: TrackRowProps) {
  const supabase = createClient();
  const [hovered, setHovered] = useState(false);
  const [justArrived, setJustArrived] = useState(false);

  // Optimistic downloaded state — updates immediately, then syncs from realtime
  const [downloaded, setDownloaded] = useState(track.downloaded);
  const prevTrackDownloaded = useRef(track.downloaded);
  useEffect(() => {
    if (prevTrackDownloaded.current !== track.downloaded) {
      prevTrackDownloaded.current = track.downloaded;
      setDownloaded(track.downloaded);
    }
  }, [track.downloaded]);

  useEffect(() => {
    const age = Date.now() - new Date(track.created_at).getTime();
    if (age < 3000) {
      setJustArrived(true);
      const t = setTimeout(() => setJustArrived(false), 2200);
      return () => clearTimeout(t);
    }
  }, [track.created_at]);

  async function toggleDownloaded(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !downloaded;
    setDownloaded(next); // optimistic
    const { error } = await supabase
      .from('tracks')
      .update({ downloaded: next })
      .eq('id', track.id);
    if (error) {
      setDownloaded(!next); // revert
      onToast(error.message, 'err');
    } else {
      onToast(next ? 'Marked as downloaded' : 'Marked as not downloaded', 'ok');
    }
  }

  const srcCode = SOURCE_CODE[track.source] ?? 'yt';
  const dim = downloaded ? 0.6 : 1;
  const position = track.set_position[0] ?? null;

  const rowBg = justArrived
    ? 'var(--mo-accent-tint)'
    : hovered
    ? 'var(--mo-bg-hover)'
    : 'transparent';

  return (
    <div
      onClick={onClick}
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

      {/* Col 1: Status circle (download toggle) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={toggleDownloaded}
          title={downloaded ? 'Mark as not downloaded' : 'Mark as downloaded'}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: downloaded
              ? 'inset 0 0 0 1px var(--mo-success)'
              : 'inset 0 0 0 1px var(--mo-hairline-strong)',
            flexShrink: 0,
            transition: 'box-shadow 0.2s',
          }}
        >
          {downloaded && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--mo-success)"
              strokeWidth="2.5"
              style={{ animation: 'mo-pop 0.22s cubic-bezier(.2,.8,.4,1)' }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
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

      {/* Col 3: Track — title + subtitle with BPM/key inline */}
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
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {track.artist && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</span>
          )}
          {track.artist && track.genre && <span style={{ color: 'var(--mo-text-3)' }}>·</span>}
          {track.genre && <span style={{ color: 'var(--mo-text-3)' }}>{track.genre}</span>}
          {(track.bpm || track.musical_key) && (
            <>
              <span style={{ color: 'var(--mo-text-3)' }}>·</span>
              <span
                style={{
                  fontFamily: 'var(--mo-font-mono)',
                  fontSize: 11,
                  color: 'var(--mo-text-3)',
                  letterSpacing: 0,
                }}
              >
                {[track.bpm && `${track.bpm}`, track.musical_key].filter(Boolean).join(' · ')}
              </span>
            </>
          )}
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
          onClick={e => { e.stopPropagation(); onClick(); }}
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
