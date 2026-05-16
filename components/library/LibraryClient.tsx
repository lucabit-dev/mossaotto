'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track, FilterState } from '@/lib/types';
import { Header } from '@/components/Header';
import { SaveBar } from './SaveBar';
import { FilterBar } from './FilterBar';
import { TrackRow, TrackRowHeaders } from './TrackRow';
import { InlineEditRow } from './InlineEditRow';
import { ExportButtons } from './ExportButtons';

interface Toast { id: number; msg: string; type: 'ok' | 'err' }

interface LibraryClientProps {
  initialTracks: Track[];
  userEmail: string | null;
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all',
  source: 'all',
  setPosition: [],
  minIntensity: null,
  minScore: null,
  search: '',
  genre: '',
  sort: 'newest',
};

// ---- Empty / No-results states ----

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px',
        gap: 20,
      }}
    >
      {/* Icon tile */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'var(--mo-bg-elev)',
          boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong), var(--mo-shadow-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--mo-text-3)" strokeWidth="1.4">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--mo-text-1)', marginBottom: 8 }}>
          Your library is empty.
        </p>
        <p style={{ fontSize: 14.5, color: 'var(--mo-text-2)', lineHeight: 1.6 }}>
          Paste a YouTube, Spotify, SoundCloud or Bandcamp URL above to add the first track.
        </p>
      </div>

      {/* Hint cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, maxWidth: 520 }}>
        {[
          { key: '⌘V', label: 'Paste a URL from any tab' },
          { key: 'Tab', label: 'Move between fields' },
          { key: '⌘↵', label: 'Save with keyboard' },
        ].map(hint => (
          <div
            key={hint.key}
            style={{
              background: 'var(--mo-bg-elev)',
              borderRadius: 12,
              boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <kbd
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 26,
                padding: '0 10px',
                borderRadius: 6,
                background: 'var(--mo-bg-sunken)',
                boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--mo-text-2)',
                alignSelf: 'flex-start',
              }}
            >
              {hint.key}
            </kbd>
            <span style={{ fontSize: 12.5, color: 'var(--mo-text-3)', lineHeight: 1.4 }}>{hint.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoResultsState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'var(--mo-bg-elev)',
          boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--mo-text-3)" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--mo-text-1)' }}>
        No tracks match these filters.
      </p>
      <button
        onClick={onClearFilters}
        style={{
          height: 34,
          padding: '0 18px',
          borderRadius: 999,
          background: 'var(--mo-accent-tint)',
          color: 'var(--mo-accent)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        Clear filters
      </button>
    </div>
  );
}

// ---- Toast stack ----

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 999,
            background: t.type === 'err' ? 'var(--mo-danger)' : 'rgba(20,22,28,0.92)',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: 'var(--mo-shadow-3)',
            whiteSpace: 'nowrap',
          }}
        >
          {t.type === 'ok' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ---- Main LibraryClient ----

export function LibraryClient({ initialTracks, userEmail }: LibraryClientProps) {
  const supabase = createClient();

  // Dark mode — stored in localStorage
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('mo-dark');
    if (stored === 'true') setDark(true);
  }, []);

  // Sync to <html data-theme> so body and global styles switch correctly
  useEffect(() => {
    if (dark) {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [dark]);

  function toggleDark() {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('mo-dark', String(next));
      return next;
    });
  }

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [editingTrack, setEditingTrack] = useState<Partial<Track> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tracks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, payload => {
        if (payload.eventType === 'INSERT') {
          setTracks(prev => [payload.new as Track, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTracks(prev => prev.map(t => t.id === (payload.new as Track).id ? payload.new as Track : t));
        } else if (payload.eventType === 'DELETE') {
          setTracks(prev => prev.filter(t => t.id !== (payload.old as Track).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);

  const genreOptions = useMemo(() =>
    [...new Set(tracks.map(t => t.genre).filter(Boolean) as string[])].sort(),
    [tracks]
  );

  const filtered = useMemo(() => {
    let result = [...tracks];

    if (filters.status === 'queue') result = result.filter(t => !t.downloaded);
    if (filters.status === 'downloaded') result = result.filter(t => t.downloaded);
    if (filters.source !== 'all') result = result.filter(t => t.source === filters.source);
    if (filters.setPosition.length > 0) result = result.filter(t =>
      filters.setPosition.some(p => t.set_position.includes(p))
    );
    if (filters.minIntensity !== null) result = result.filter(t => t.intensity !== null && t.intensity >= filters.minIntensity!);
    if (filters.minScore !== null) result = result.filter(t => t.score !== null && t.score >= filters.minScore!);
    if (filters.genre) result = result.filter(t => t.genre?.toLowerCase().includes(filters.genre.toLowerCase()));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t =>
        [t.title, t.artist, t.genre, t.notes].some(f => f?.toLowerCase().includes(q))
      );
    }

    switch (filters.sort) {
      case 'oldest': result.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case 'score_desc': result.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); break;
      case 'intensity_desc': result.sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0)); break;
      case 'bpm_asc': result.sort((a, b) => (a.bpm ?? 9999) - (b.bpm ?? 9999)); break;
      case 'bpm_desc': result.sort((a, b) => (b.bpm ?? 0) - (a.bpm ?? 0)); break;
      case 'title_az': result.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')); break;
      default: result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    return result;
  }, [tracks, filters]);

  const queueCount = useMemo(() => tracks.filter(t => !t.downloaded).length, [tracks]);

  function handleOpenNew(url: string, source: string, title: string | null, artist: string | null, artworkUrl: string | null) {
    setEditingTrack({ url, source: source as Track['source'], title, artist, artwork_url: artworkUrl });
  }

  function handleOpenExisting(track: Track) {
    setEditingTrack(track);
  }

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--mo-bg)',
        color: 'var(--mo-text-1)',
      }}
    >
      <Header userEmail={userEmail} dark={dark} onToggleDark={toggleDark} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--mo-bg)',
        }}
      >
        <SaveBar
          existingTracks={tracks}
          onOpenNew={handleOpenNew}
          onOpenExisting={handleOpenExisting}
          onToast={showToast}
        />

        {editingTrack ? (
          <InlineEditRow
            track={editingTrack}
            onClose={() => setEditingTrack(null)}
            onToast={showToast}
            genreOptions={genreOptions}
            userEmail={userEmail}
          />
        ) : (
          <>
            <FilterBar
              filters={filters}
              onChange={partial => setFilters(prev => ({ ...prev, ...partial }))}
              genreOptions={genreOptions}
              shown={filtered.length}
              total={tracks.length}
              queue={queueCount}
            />
            <div
              style={{
                padding: '4px 32px 4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--mo-text-3)' }}>
                <span style={{ color: 'var(--mo-text-2)', fontWeight: 600 }}>{filtered.length}</span>
                {' '}shown ·{' '}
                <span style={{ color: 'var(--mo-text-2)', fontWeight: 600 }}>{tracks.length}</span>
                {' '}total ·{' '}
                <span style={{ color: 'var(--mo-text-2)', fontWeight: 600 }}>{queueCount}</span>
                {' '}in queue
              </span>
              <ExportButtons filtered={filtered} onToast={showToast} />
            </div>
          </>
        )}

        {/* Track list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 32px' }}>
          {tracks.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <NoResultsState onClearFilters={clearFilters} />
          ) : (
            <>
              <TrackRowHeaders />
              {filtered.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onClick={() => setEditingTrack(track)}
                  onToast={showToast}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
