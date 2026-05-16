'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';
import { SourceDot, PositionDots, IntensityBars, ScorePips } from '@/components/primitives';
import { bpmLookup } from '@/lib/lookup';

interface TrackRowProps {
  track: Track;
  onClick: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

const SOURCE_CODE: Record<string, string> = {
  youtube: 'yt',
  spotify: 'sp',
  soundcloud: 'sc',
  bandcamp: 'bc',
};

export function TrackRowHeaders() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 40px 1fr 110px 110px 100px 110px 64px',
        alignItems: 'center',
        gap: 16,
        height: 28,
        padding: '0 16px',
      }}
    >
      <span className="mo-eyebrow" />
      <span className="mo-eyebrow" />
      <span className="mo-eyebrow">Track</span>
      <span className="mo-eyebrow">Position</span>
      <span className="mo-eyebrow">Intensity</span>
      <span className="mo-eyebrow">Score</span>
      <span className="mo-eyebrow" style={{ textAlign: 'right' }}>BPM / Key</span>
      <span className="mo-eyebrow" />
    </div>
  );
}

export function TrackRow({ track, onClick, onToast }: TrackRowProps) {
  const supabase = createClient();
  const [hovered, setHovered] = useState(false);
  const [justArrived, setJustArrived] = useState(false);
  const [bpmRefreshing, setBpmRefreshing] = useState(false);

  useEffect(() => {
    // Brief highlight when freshly inserted (within 3s of created_at)
    const age = Date.now() - new Date(track.created_at).getTime();
    if (age < 3000) {
      setJustArrived(true);
      const t = setTimeout(() => setJustArrived(false), 2000);
      return () => clearTimeout(t);
    }
  }, [track.created_at]);

  async function toggleDownloaded(e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from('tracks')
      .update({ downloaded: !track.downloaded })
      .eq('id', track.id);
    if (error) onToast(error.message, 'err');
    else onToast(track.downloaded ? 'Marked as not downloaded' : 'Marked as downloaded', 'ok');
  }

  async function refreshBpm(e: React.MouseEvent) {
    e.stopPropagation();
    if (!track.artist || !track.title) {
      onToast('Artist and title required for BPM lookup', 'err');
      return;
    }
    setBpmRefreshing(true);
    try {
      const result = await bpmLookup(track.artist, track.title);
      if (result.bpm) {
        const { error } = await supabase
          .from('tracks')
          .update({ bpm: result.bpm, musical_key: result.key ?? track.musical_key })
          .eq('id', track.id);
        if (error) onToast(error.message, 'err');
        else onToast(`BPM updated via ${result.source ?? 'lookup'}`);
      } else {
        onToast('No BPM found', 'err');
      }
    } finally {
      setBpmRefreshing(false);
    }
  }

  const srcCode = SOURCE_CODE[track.source] ?? 'yt';
  const dim = track.downloaded ? 0.6 : 1;

  // Position: use first element of set_position array
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
        gridTemplateColumns: '24px 40px 1fr 110px 110px 100px 110px 64px',
        alignItems: 'center',
        gap: 16,
        height: 60,
        padding: '0 16px',
        borderRadius: 12,
        background: rowBg,
        cursor: 'pointer',
        transition: 'background .15s',
        position: 'relative',
      }}
    >
      {/* Accent rail when justArrived */}
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
          title={track.downloaded ? 'Mark as not downloaded' : 'Mark as downloaded'}
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
            boxShadow: track.downloaded
              ? 'inset 0 0 0 1px var(--mo-success)'
              : 'inset 0 0 0 1px var(--mo-hairline-strong)',
            flexShrink: 0,
          }}
        >
          {track.downloaded && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--mo-success)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Col 2: Source tile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
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

      {/* Col 3: Title / Artist / Genre */}
      <div style={{ minWidth: 0, opacity: dim }}>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 600,
            letterSpacing: '-0.012em',
            color: 'var(--mo-text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.title ?? '—'}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--mo-text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.artist ?? ''}
          {track.artist && track.genre && (
            <span style={{ color: 'var(--mo-text-3)' }}> · {track.genre}</span>
          )}
          {!track.artist && track.genre && (
            <span style={{ color: 'var(--mo-text-3)' }}>{track.genre}</span>
          )}
        </div>
      </div>

      {/* Col 4: Position */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: dim,
        }}
      >
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

      {/* Col 5: Intensity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IntensityBars value={track.intensity ?? 0} size="md" />
        {track.intensity && (
          <span className="mo-mono" style={{ fontSize: 11.5, color: 'var(--mo-text-3)' }}>
            {track.intensity}
          </span>
        )}
      </div>

      {/* Col 6: Score */}
      <div>
        <ScorePips value={track.score ?? 0} size="md" />
      </div>

      {/* Col 7: BPM / Key */}
      <div
        style={{
          textAlign: 'right',
          opacity: track.downloaded ? 0.75 : 1,
        }}
      >
        {track.bpm && (
          <div className="mo-mono" style={{ fontSize: 11.5 }}>
            <span style={{ color: 'var(--mo-text-3)' }}>BPM </span>
            <span style={{ color: 'var(--mo-text-1)' }}>{track.bpm}</span>
          </div>
        )}
        {track.musical_key && (
          <div className="mo-mono" style={{ fontSize: 11.5 }}>
            <span style={{ color: 'var(--mo-text-3)' }}>KEY </span>
            <span style={{ color: 'var(--mo-text-1)' }}>{track.musical_key}</span>
          </div>
        )}
      </div>

      {/* Col 8: actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
        {hovered && (
          <button
            onClick={refreshBpm}
            disabled={bpmRefreshing}
            title="Refresh BPM / Key"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              cursor: bpmRefreshing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mo-text-3)',
              opacity: bpmRefreshing ? 0.5 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        )}
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
