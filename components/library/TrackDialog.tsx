'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track, SetPosition } from '@/lib/types';
import { cn } from '@/lib/utils';

type IntensityScore = 1 | 2 | 3 | 4 | 5;

interface TrackDialogProps {
  track: Partial<Track> | null;
  genreOptions: string[];
  userEmail: string | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

const SET_POSITIONS: SetPosition[] = ['open', 'middle', 'close'];
const RATINGS: IntensityScore[] = [1, 2, 3, 4, 5];

export function TrackDialog({ track, genreOptions, userEmail, onClose, onToast }: TrackDialogProps) {
  const supabase = createClient();
  const isEdit = !!track?.id;

  const [title, setTitle] = useState(track?.title ?? '');
  const [artist, setArtist] = useState(track?.artist ?? '');
  const [genre, setGenre] = useState(track?.genre ?? '');
  const [intensity, setIntensity] = useState<IntensityScore | null>(track?.intensity ?? null);
  const [score, setScore] = useState<IntensityScore | null>(track?.score ?? null);
  const [setPosition, setSetPosition] = useState<SetPosition[]>(track?.set_position ?? []);
  const [bpm, setBpm] = useState(track?.bpm ? String(track.bpm) : '');
  const [musicalKey, setMusicalKey] = useState(track?.musical_key ?? '');
  const [notes, setNotes] = useState(track?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function toggleSetPosition(pos: SetPosition) {
    setSetPosition(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  }

  function toggleIntensity(val: IntensityScore) {
    setIntensity(prev => prev === val ? null : val);
  }

  function toggleScore(val: IntensityScore) {
    setScore(prev => prev === val ? null : val);
  }

  async function handleSave() {
    if (!track?.url) return;
    setSaving(true);

    const payload = {
      url: track.url,
      source: track.source ?? 'other',
      title: title || null,
      artist: artist || null,
      artwork_url: track.artwork_url ?? null,
      duration_seconds: track.duration_seconds ?? null,
      genre: genre || null,
      intensity: intensity ?? null,
      score: score ?? null,
      set_position: setPosition,
      bpm: bpm ? parseFloat(bpm) : null,
      musical_key: musicalKey || null,
      notes: notes || null,
      added_by: isEdit ? track.added_by : (userEmail ?? null),
      downloaded: track.downloaded ?? false,
    };

    const { error } = isEdit
      ? await supabase.from('tracks').update(payload).eq('id', track.id!)
      : await supabase.from('tracks').insert(payload);

    setSaving(false);
    if (error) {
      if (error.code === '23505') onToast('URL already in library', 'err');
      else onToast(error.message, 'err');
    } else {
      onToast(isEdit ? 'Track updated' : 'Track saved', 'ok');
      onClose();
    }
  }

  async function handleDelete() {
    if (!track?.id) return;
    if (!confirm('Delete this track?')) return;
    const { error } = await supabase.from('tracks').delete().eq('id', track.id);
    if (error) onToast(error.message, 'err');
    else { onToast('Track deleted'); onClose(); }
  }

  if (!track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-zinc-800">
          {track.artwork_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.artwork_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <SourceBadge source={track.source ?? 'other'} />
              <span className="text-zinc-500 text-xs truncate">{track.url}</span>
            </div>
            <p className="text-xs text-zinc-500">
              {isEdit ? 'Edit track' : 'Add to library'} · Cmd+Enter to save · Esc to close
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white ml-2 flex-shrink-0 text-lg leading-none">×</button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Artist">
              <input value={artist} onChange={e => setArtist(e.target.value)} ref={titleRef}
                className={inputCls} placeholder="Artist name" />
            </Field>
            <Field label="Title">
              <input value={title} onChange={e => setTitle(e.target.value)}
                className={inputCls} placeholder="Track title" />
            </Field>
          </div>

          <Field label="Genre">
            <input value={genre} onChange={e => setGenre(e.target.value)} list="genre-list"
              className={inputCls} placeholder="e.g. Techno, House…" />
            <datalist id="genre-list">
              {genreOptions.map(g => <option key={g} value={g} />)}
            </datalist>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="BPM">
              <input type="number" min={40} max={220} value={bpm} onChange={e => setBpm(e.target.value)}
                className={inputCls} placeholder="120" />
            </Field>
            <Field label="Key">
              <input value={musicalKey} onChange={e => setMusicalKey(e.target.value)}
                className={inputCls} placeholder="e.g. Am, F#m…" />
            </Field>
          </div>

          <Field label="Intensity">
            <ChipGroup values={RATINGS} selected={intensity} onToggle={toggleIntensity} color="fuchsia" />
          </Field>

          <Field label="Score">
            <ChipGroup values={RATINGS} selected={score} onToggle={toggleScore} color="amber" renderLabel={v => '★'.repeat(v)} />
          </Field>

          <Field label="Set position">
            <div className="flex gap-2 flex-wrap">
              {SET_POSITIONS.map(pos => (
                <button key={pos} type="button"
                  onClick={() => toggleSetPosition(pos)}
                  className={cn('px-3 py-1 rounded text-xs font-medium border transition-colors capitalize',
                    setPosition.includes(pos)
                      ? 'bg-fuchsia-600 border-fuchsia-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  )}>
                  {pos}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className={cn(inputCls, 'resize-none')} placeholder="Optional notes…" />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
          {isEdit ? (
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-xs transition-colors">
              Delete track
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 text-sm bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-medium rounded transition-colors">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Save track'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500';

function ChipGroup<T extends number>({
  values, selected, onToggle, color = 'fuchsia', renderLabel,
}: {
  values: T[];
  selected: T | null;
  onToggle: (v: T) => void;
  color?: 'fuchsia' | 'amber';
  renderLabel?: (v: T) => string;
}) {
  return (
    <div className="flex gap-2">
      {values.map(v => {
        const active = selected === v;
        const activeClass = color === 'amber'
          ? 'bg-amber-500 border-amber-400 text-white'
          : 'bg-fuchsia-600 border-fuchsia-500 text-white';
        return (
          <button key={v} type="button" onClick={() => onToggle(v)}
            className={cn('w-9 h-9 rounded text-sm font-medium border transition-colors',
              active ? activeClass : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
            )}>
            {renderLabel ? renderLabel(v) : v}
          </button>
        );
      })}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    youtube:    { label: 'YT',  cls: 'bg-red-900/60 text-red-300 border-red-800' },
    spotify:    { label: 'SP',  cls: 'bg-green-900/60 text-green-300 border-green-800' },
    soundcloud: { label: 'SC',  cls: 'bg-orange-900/60 text-orange-300 border-orange-800' },
    bandcamp:   { label: 'BC',  cls: 'bg-teal-900/60 text-teal-300 border-teal-800' },
    other:      { label: '?',   cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  };
  const { label, cls } = map[source] ?? map.other;
  return <span className={cn('text-xs px-1.5 py-0.5 rounded border font-mono flex-shrink-0', cls)}>{label}</span>;
}
