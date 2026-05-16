'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Track, FilterState, SortKey } from '@/lib/types';
import { Header } from '@/components/Header';
import { SaveBar } from './SaveBar';
import { FilterBar } from './FilterBar';
import { TrackRow, TrackRowHeaders } from './TrackRow';
import { InlineEditRow } from './InlineEditRow';
import { ExportButtons } from './ExportButtons';
import { IntensityBars, ScorePips } from '@/components/primitives';

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

const toolbarBtnStyle: React.CSSProperties = {
  height: 28,
  padding: '0 12px',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  background: 'transparent',
  fontSize: 13,
  fontWeight: 500,
};

// ---- Main LibraryClient ----

export function LibraryClient({ initialTracks, userEmail }: LibraryClientProps) {
  const supabase = createClient();
  const router = useRouter();

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

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [editingTrack, setEditingTrack] = useState<Partial<Track> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(new Set());

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());

  // Mobile filter sheet
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  function handleSelectRow(id: string, on: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

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
          const id = (payload.old as Track).id;
          setExitingIds(prev => new Set([...prev, id]));
          setTimeout(() => {
            setTracks(prev => prev.filter(t => t.id !== id));
            setExitingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
          }, 340);
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

  async function handleMarkDownloaded(value: boolean) {
    const ids = [...selectedIds];
    setTracks(prev => prev.map(t => ids.includes(t.id) ? { ...t, downloaded: value } : t));
    const { error } = await supabase.from('tracks').update({ downloaded: value }).in('id', ids);
    if (error) {
      setTracks(prev => prev.map(t => ids.includes(t.id) ? { ...t, downloaded: !value } : t));
      showToast(error.message, 'err');
    } else {
      showToast(`${ids.length} tracks ${value ? 'marked downloaded' : 'moved to queue'}`, 'ok');
      clearSelection();
    }
  }

  async function handleDeleteSelected() {
    const ids = [...selectedIds];
    setExitingIds(prev => new Set([...prev, ...ids]));
    setTimeout(async () => {
      const { error } = await supabase.from('tracks').delete().in('id', ids);
      if (error) {
        setExitingIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
        showToast(error.message, 'err');
      } else {
        setTracks(prev => prev.filter(t => !ids.includes(t.id)));
        setExitingIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
        showToast(`${ids.length} tracks deleted`, 'ok');
        clearSelection();
      }
    }, 340);
  }

  function handleOpenNew(url: string, source: string, title: string | null, artist: string | null, artworkUrl: string | null) {
    setEditingTrack({ url, source: source as Track['source'], title, artist, artwork_url: artworkUrl });
  }

  function handleOpenExisting(track: Track) {
    setEditingTrack(track);
  }

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  const hasActiveFilters =
    filters.source !== 'all' ||
    filters.setPosition.length > 0 ||
    filters.minIntensity !== null ||
    filters.minScore !== null ||
    filters.genre !== '';

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
      {isMobile ? (
        /* Mobile header */
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--mo-bg-vibrancy)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderBottom: '1px solid var(--mo-hairline)',
          padding: '0 16px', height: 52,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
            <svg width="18" height="13" viewBox="0 0 20 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="var(--mo-text-1)" strokeWidth="1.2" />
              <circle cx="13" cy="7" r="6.5" stroke="var(--mo-text-1)" strokeWidth="1.2" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.04em', color: 'var(--mo-text-1)' }}>
              MOSSA OTTO
            </span>
          </div>
          {/* Presence pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'var(--mo-bg-elev)', boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mo-success)', boxShadow: '0 0 0 2px rgba(31,138,91,.2)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--mo-text-2)', fontWeight: 500 }}>Online</span>
          </div>
          {/* Avatar button */}
          <button onClick={signOut} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--mo-accent)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {userEmail ? userEmail[0].toUpperCase() : '?'}
          </button>
        </header>
      ) : (
        <Header
          userEmail={userEmail}
          dark={dark}
          onToggleDark={toggleDark}
          search={filters.search}
          onSearchChange={v => setFilters(prev => ({ ...prev, search: v }))}
        />
      )}

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
            isMobile={isMobile}
          />
        ) : (
          <>
            {/* Mobile filter bar */}
            {isMobile && (
              <div style={{
                position: 'sticky', top: 52, zIndex: 40,
                background: 'var(--mo-bg-vibrancy)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--mo-hairline)',
                padding: '8px 16px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {/* Status segmented */}
                <div style={{ display: 'inline-flex', padding: 3, borderRadius: 999, background: 'var(--mo-bg-sunken)', boxShadow: 'inset 0 0 0 1px var(--mo-hairline)', flex: 1 }}>
                  {[
                    { value: 'all' as const, label: 'All' },
                    { value: 'queue' as const, label: 'Queue' },
                    { value: 'downloaded' as const, label: 'DL' },
                  ].map(opt => {
                    const active = filters.status === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setFilters(prev => ({ ...prev, status: opt.value }))}
                        style={{
                          flex: 1, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-bg-elev)' : 'transparent',
                          boxShadow: active ? '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--mo-hairline-strong)' : 'none',
                          color: active ? 'var(--mo-text-1)' : 'var(--mo-text-2)',
                          fontWeight: 600, fontSize: 12, transition: 'all .12s',
                        }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {/* Filter icon button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--mo-bg-elev)',
                    boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--mo-text-2)', position: 'relative',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 6h16M7 12h10M10 18h4" />
                  </svg>
                  {hasActiveFilters && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 7, height: 7, borderRadius: '50%', background: 'var(--mo-accent)',
                    }} />
                  )}
                </button>
              </div>
            )}

            {/* Desktop filter bar */}
            {!isMobile && (
              <FilterBar
                filters={filters}
                onChange={partial => setFilters(prev => ({ ...prev, ...partial }))}
                genreOptions={genreOptions}
                shown={filtered.length}
                total={tracks.length}
                queue={queueCount}
              />
            )}

            {/* Multi-select toolbar / stats+export toolbar */}
            {selectedIds.size > 0 ? (
              <div style={{
                padding: '6px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--mo-accent-tint)',
                borderTop: '1px solid var(--mo-accent-ring)',
                borderBottom: '1px solid var(--mo-accent-ring)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--mo-accent)', fontWeight: 600 }}>
                  {selectedIds.size} selected
                </span>
                <div style={{ width: 1, height: 14, background: 'var(--mo-accent-ring)' }} />
                <button onClick={() => handleMarkDownloaded(true)} style={{ ...toolbarBtnStyle, color: 'var(--mo-text-1)' }}>Mark downloaded</button>
                <button onClick={() => handleMarkDownloaded(false)} style={{ ...toolbarBtnStyle, color: 'var(--mo-text-1)' }}>Mark as queue</button>
                <button onClick={handleDeleteSelected} style={{ ...toolbarBtnStyle, color: 'var(--mo-danger)' }}>Remove</button>
                <div style={{ flex: 1 }} />
                <button onClick={clearSelection} style={{ ...toolbarBtnStyle, color: 'var(--mo-accent)' }}>Clear</button>
              </div>
            ) : (
              !isMobile && (
                <div
                  style={{
                    padding: '4px 32px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12.5, color: 'var(--mo-text-3)', fontWeight: 500 }}>
                    <span style={{ color: 'var(--mo-text-1)', fontWeight: 600 }}>{filtered.length}</span>
                    {' '}shown
                    <span style={{ color: 'var(--mo-text-4, var(--mo-text-3))' }}> · </span>
                    {tracks.length} total
                    <span style={{ color: 'var(--mo-text-4, var(--mo-text-3))' }}> · </span>
                    <span style={{ color: 'var(--mo-accent)' }}>{queueCount} in queue</span>
                  </span>
                  <div style={{ flex: 1 }} />
                  <ExportButtons filtered={filtered} onToast={showToast} />
                </div>
              )
            )}
          </>
        )}

        {/* Track list */}
        {isMobile ? (
          /* Mobile card list */
          !editingTrack && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px 32px' }}>
              {tracks.length === 0 ? (
                <EmptyState />
              ) : filtered.length === 0 ? (
                <NoResultsState onClearFilters={clearFilters} />
              ) : (
                filtered.map(track => {
                  const srcDotColor =
                    track.source === 'youtube' ? 'var(--mo-src-yt)'
                    : track.source === 'spotify' ? 'var(--mo-src-sp)'
                    : track.source === 'soundcloud' ? 'var(--mo-src-sc)'
                    : 'var(--mo-src-bc)';
                  return (
                    <div
                      key={track.id}
                      onClick={() => setEditingTrack(track)}
                      style={{
                        background: 'var(--mo-bg-elev)',
                        borderRadius: 14,
                        boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
                        padding: '14px 14px',
                        cursor: 'pointer',
                        opacity: track.downloaded ? 0.7 : 1,
                        transition: 'opacity .2s, background .15s',
                        animation: exitingIds.has(track.id) ? 'mo-exit 0.32s cubic-bezier(.4,0,1,1) forwards' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* Source tile */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, background: 'var(--mo-bg-sunken)',
                          boxShadow: 'inset 0 0 0 1px var(--mo-hairline)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mo-text-3)" strokeWidth="1.6">
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="16" r="3" />
                          </svg>
                          <span style={{
                            position: 'absolute', right: -2, bottom: -2, width: 10, height: 10, borderRadius: '50%',
                            background: srcDotColor,
                            boxShadow: '0 0 0 2px var(--mo-bg-elev)',
                          }} />
                        </div>
                        {/* Track info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--mo-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {track.title ?? '—'}
                            </span>
                            {track.downloaded && (
                              <span style={{ padding: '1px 7px', borderRadius: 999, flexShrink: 0, background: 'rgba(31,138,91,.10)', boxShadow: 'inset 0 0 0 1px rgba(31,138,91,.28)', color: 'var(--mo-success)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>DL</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--mo-text-2)' }}>
                            {[
                              track.artist,
                              track.genre,
                              track.bpm ? `${track.bpm} BPM` : null,
                              track.musical_key,
                            ].filter(Boolean).join(' · ')}
                          </div>
                          {/* Ratings row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                            {track.set_position[0] && (
                              <span style={{ fontSize: 11, color: 'var(--mo-text-3)', textTransform: 'capitalize' as const, fontWeight: 500 }}>
                                {track.set_position[0]}
                              </span>
                            )}
                            {track.intensity && <IntensityBars value={track.intensity} size="sm" />}
                            {track.score && <ScorePips value={track.score} size="sm" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        ) : (
          /* Desktop row list */
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 32px' }}>
            {tracks.length === 0 ? (
              <EmptyState />
            ) : filtered.length === 0 ? (
              <NoResultsState onClearFilters={clearFilters} />
            ) : (
              <>
                <TrackRowHeaders />
                {filtered.map(track => (
                  <div
                    key={track.id}
                    style={{
                      overflow: 'hidden',
                      animation: exitingIds.has(track.id)
                        ? 'mo-exit 0.32s cubic-bezier(.4,0,1,1) forwards'
                        : undefined,
                    }}
                  >
                    <TrackRow
                      track={track}
                      onClick={() => setEditingTrack(track)}
                      onToast={showToast}
                      selected={selectedIds.has(track.id)}
                      onSelect={handleSelectRow}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile filters bottom sheet */}
      {isMobile && showMobileFilters && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div onClick={() => setShowMobileFilters(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,11,14,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
          {/* Sheet */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'var(--mo-bg-elev)',
            borderRadius: '22px 22px 0 0',
            padding: '0 0 32px',
            boxShadow: 'var(--mo-shadow-3)',
            animation: 'mo-sheet-in 0.28s cubic-bezier(.2,.8,.4,1)',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--mo-hairline-xstrong)' }} />
            </div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--mo-hairline)' }}>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--mo-text-1)', letterSpacing: '-0.015em' }}>Filter & sort</span>
              <button onClick={() => { setFilters(DEFAULT_FILTERS); setShowMobileFilters(false); }}
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--mo-accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                Reset
              </button>
            </div>
            {/* Sheet content */}
            <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Source */}
              <div>
                <span className="mo-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Source</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {(['youtube', 'spotify', 'soundcloud', 'bandcamp'] as const).map(src => {
                    const labels: Record<string, string> = { youtube: 'YouTube', spotify: 'Spotify', soundcloud: 'SoundCloud', bandcamp: 'Bandcamp' };
                    const dots: Record<string, string> = { youtube: 'var(--mo-src-yt)', spotify: 'var(--mo-src-sp)', soundcloud: 'var(--mo-src-sc)', bandcamp: 'var(--mo-src-bc)' };
                    const active = filters.source === src;
                    return (
                      <button key={src} onClick={() => setFilters(prev => ({ ...prev, source: active ? 'all' : src }))}
                        style={{
                          height: 40, padding: '0 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-accent-tint)' : 'var(--mo-bg-sunken)',
                          color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
                          boxShadow: `inset 0 0 0 1px ${active ? 'var(--mo-accent-ring)' : 'var(--mo-hairline-strong)'}`,
                          fontWeight: 500, fontSize: 13.5,
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                        }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dots[src], flexShrink: 0 }} />
                        {labels[src]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Position */}
              <div>
                <span className="mo-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Position</span>
                <div style={{ display: 'inline-flex', padding: 3, borderRadius: 999, background: 'var(--mo-bg-sunken)', boxShadow: 'inset 0 0 0 1px var(--mo-hairline)' }}>
                  {(['open', 'middle', 'close'] as const).map(pos => {
                    const active = filters.setPosition.includes(pos);
                    return (
                      <button key={pos} onClick={() => setFilters(prev => {
                        const cur = prev.setPosition;
                        return { ...prev, setPosition: cur.includes(pos) ? cur.filter(x => x !== pos) : [...cur, pos] };
                      })}
                        style={{
                          height: 40, padding: '0 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-bg-elev)' : 'transparent',
                          boxShadow: active ? '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--mo-hairline-strong)' : 'none',
                          color: active ? 'var(--mo-text-1)' : 'var(--mo-text-2)',
                          fontWeight: 600, fontSize: 13.5, textTransform: 'capitalize' as const,
                        }}>
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Intensity ≥ */}
              <div>
                <span className="mo-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Intensity ≥</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                  {([null, 1, 2, 3, 4, 5] as (number | null)[]).map(v => {
                    const active = filters.minIntensity === v;
                    return (
                      <button key={String(v)} onClick={() => setFilters(prev => ({ ...prev, minIntensity: v }))}
                        style={{
                          height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-accent-tint)' : 'var(--mo-bg-sunken)',
                          color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
                          boxShadow: active ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                          fontSize: 13.5, fontWeight: active ? 700 : 500,
                        }}>
                        {v === null ? 'Any' : v}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Score ≥ */}
              <div>
                <span className="mo-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Score ≥</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                  {([null, 1, 2, 3, 4, 5] as (number | null)[]).map(v => {
                    const active = filters.minScore === v;
                    return (
                      <button key={String(v)} onClick={() => setFilters(prev => ({ ...prev, minScore: v }))}
                        style={{
                          height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-accent-tint)' : 'var(--mo-bg-sunken)',
                          color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
                          boxShadow: active ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                          fontSize: 13.5, fontWeight: active ? 700 : 500,
                        }}>
                        {v === null ? 'Any' : v}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Sort */}
              <div>
                <span className="mo-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Sort by</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { value: 'newest', label: 'Newest first' },
                    { value: 'oldest', label: 'Oldest first' },
                    { value: 'score_desc', label: 'Score ↓' },
                    { value: 'intensity_desc', label: 'Intensity ↓' },
                    { value: 'bpm_asc', label: 'BPM ↑' },
                    { value: 'bpm_desc', label: 'BPM ↓' },
                    { value: 'title_az', label: 'Title A–Z' },
                  ].map(opt => {
                    const active = filters.sort === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setFilters(prev => ({ ...prev, sort: opt.value as SortKey }))}
                        style={{
                          height: 44, padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-accent-tint)' : 'transparent',
                          color: active ? 'var(--mo-accent)' : 'var(--mo-text-1)',
                          boxShadow: active ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'none',
                          fontSize: 14, fontWeight: active ? 700 : 500, textAlign: 'left' as const,
                        }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Sticky footer */}
            <div style={{ padding: '0 20px', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
              <button
                onClick={() => setShowMobileFilters(false)}
                style={{
                  width: '100%', height: 52, borderRadius: 14,
                  background: 'var(--mo-accent)', border: 'none', cursor: 'pointer',
                  color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
                }}>
                Show {filtered.length} tracks
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
