'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track, FilterState } from '@/lib/types';
import { SaveBar } from './SaveBar';
import { FilterBar } from './FilterBar';
import { TrackRow } from './TrackRow';
import { TrackDialog } from './TrackDialog';
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

export function LibraryClient({ initialTracks, userEmail }: LibraryClientProps) {
  const supabase = createClient();
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [dialogTrack, setDialogTrack] = useState<Partial<Track> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

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
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setDialogTrack({ url, source: source as Track['source'], title, artist, artwork_url: artworkUrl });
  }

  function handleOpenExisting(track: Track) {
    setDialogTrack(track);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <SaveBar
        existingTracks={tracks}
        onOpenNew={handleOpenNew}
        onOpenExisting={handleOpenExisting}
        onToast={showToast}
      />
      <FilterBar
        filters={filters}
        onChange={partial => setFilters(prev => ({ ...prev, ...partial }))}
        genreOptions={genreOptions}
        shown={filtered.length}
        total={tracks.length}
        queue={queueCount}
      />
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <ExportButtons filtered={filtered} onToast={showToast} />
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            {tracks.length === 0 ? 'No tracks yet — paste a URL above to add the first one.' : 'No tracks match the current filters.'}
          </div>
        ) : (
          filtered.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              onClick={() => setDialogTrack(track)}
              onToast={showToast}
            />
          ))
        )}
      </div>

      {/* Dialog */}
      {dialogTrack && (
        <TrackDialog
          track={dialogTrack}
          genreOptions={genreOptions}
          userEmail={userEmail}
          onClose={() => setDialogTrack(null)}
          onToast={showToast}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow-lg text-sm font-medium transition-all ${
            t.type === 'err' ? 'bg-red-600 text-white' : 'bg-zinc-700 text-white border border-zinc-600'
          }`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
