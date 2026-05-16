'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track, SetPosition } from '@/lib/types';
import { ScorePips, IntensityBars, PositionDots } from '@/components/primitives';
import { bpmLookup } from '@/lib/lookup';

type IntensityScore = 1 | 2 | 3 | 4 | 5;

interface InlineEditRowProps {
  track: Partial<Track>;
  genreOptions: string[];
  userEmail: string | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

const SET_POSITIONS: SetPosition[] = ['open', 'middle', 'close'];
const RATINGS: IntensityScore[] = [1, 2, 3, 4, 5];

const SOURCE_CODE: Record<string, string> = {
  youtube: 'yt',
  spotify: 'sp',
  soundcloud: 'sc',
  bandcamp: 'bc',
};

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span className="mo-eyebrow">{children}</span>
      {hint && (
        <kbd
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 16,
            padding: '0 4px',
            borderRadius: 4,
            background: 'var(--mo-bg-sunken)',
            boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
            fontSize: 10,
            color: 'var(--mo-text-3)',
          }}
        >
          {hint}
        </kbd>
      )}
    </div>
  );
}

function RatingPicker({
  label,
  hint,
  value,
  onChange,
  Visual,
}: {
  label: string;
  hint?: string;
  value: IntensityScore | null;
  onChange: (v: IntensityScore | null) => void;
  Visual: typeof IntensityBars | typeof ScorePips;
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 6px 5px 12px',
          borderRadius: 12,
          background: 'var(--mo-bg-sunken)',
          boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            flexShrink: 0,
          }}
          aria-hidden
        >
          <Visual value={value ?? 0} size="md" />
        </span>
        <span
          style={{ width: 1, height: 22, background: 'var(--mo-hairline-strong)', flexShrink: 0 }}
        />
        <div style={{ display: 'inline-flex', gap: 2, padding: 2 }}>
          {RATINGS.map(v => {
            const filled = value !== null && v <= value;
            const selected = value === v;
            return (
              <button
                key={v}
                type="button"
                aria-label={`${label} ${v}`}
                aria-pressed={selected}
                onClick={() => onChange(selected ? null : v)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: selected
                    ? 'var(--mo-bg-elev)'
                    : filled
                    ? 'var(--mo-accent-tint)'
                    : 'transparent',
                  boxShadow: selected
                    ? '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--mo-accent-ring)'
                    : 'none',
                  color: selected || filled ? 'var(--mo-accent)' : 'var(--mo-text-3)',
                  fontSize: 13,
                  fontWeight: selected ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all .12s',
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SoftInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus = false,
  min,
  max,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  min?: number;
  max?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      min={min}
      max={max}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        height: 36,
        padding: '0 12px',
        borderRadius: 10,
        background: 'var(--mo-bg-elev)',
        border: 'none',
        outline: 'none',
        boxShadow: focused
          ? '0 0 0 1px var(--mo-accent-ring), 0 0 0 4px var(--mo-accent-tint)'
          : 'inset 0 0 0 1px var(--mo-hairline-strong)',
        fontSize: 14,
        color: 'var(--mo-text-1)',
        fontFamily: 'var(--mo-font-text)',
        boxSizing: 'border-box',
        transition: 'box-shadow .15s',
      }}
    />
  );
}

export function InlineEditRow({ track, genreOptions, userEmail, onClose, onToast }: InlineEditRowProps) {
  const supabase = createClient();
  const isEdit = !!track.id;
  const titleRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(track.title ?? '');
  const [artist, setArtist] = useState(track.artist ?? '');
  const [genre, setGenre] = useState(track.genre ?? '');
  const [intensity, setIntensity] = useState<IntensityScore | null>(track.intensity ?? null);
  const [score, setScore] = useState<IntensityScore | null>(track.score ?? null);
  const [setPosition, setSetPosition] = useState<SetPosition | null>(
    track.set_position && track.set_position.length > 0 ? track.set_position[0] : null
  );
  const [bpm, setBpm] = useState(track.bpm ? String(track.bpm) : '');
  const [musicalKey, setMusicalKey] = useState(track.musical_key ?? '');
  const [notes, setNotes] = useState(track.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [bpmLoading, setBpmLoading] = useState(false);
  const bpmUserEdited = useRef(false);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSave();
        return;
      }
      if (!isInput) {
        if (e.key === 'o') setSetPosition('open');
        if (e.key === 'm') setSetPosition('middle');
        if (e.key === 'c') setSetPosition('close');
        if (!e.shiftKey && e.key >= '1' && e.key <= '5') {
          setIntensity(parseInt(e.key, 10) as IntensityScore);
        }
        if (e.shiftKey && e.key >= '1' && e.key <= '5') {
          setScore(parseInt(e.key, 10) as IntensityScore);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const a = track.artist ?? '';
    const t = track.title ?? '';
    if (a && t && !track.bpm) {
      setBpmLoading(true);
      bpmLookup(a, t)
        .then(result => {
          if (!bpmUserEdited.current) {
            if (result.bpm) setBpm(String(result.bpm));
            if (result.key) setMusicalKey(result.key);
          }
        })
        .catch(() => {})
        .finally(() => setBpmLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!track.url) return;
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
      set_position: setPosition ? [setPosition] : [],
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
    if (!track.id) return;
    if (!confirm('Delete this track?')) return;
    const { error } = await supabase.from('tracks').delete().eq('id', track.id);
    if (error) onToast(error.message, 'err');
    else { onToast('Track deleted'); onClose(); }
  }

  async function handleRefreshBpm() {
    const a = artist || track.artist || '';
    const t = title || track.title || '';
    if (!a || !t) return;
    setBpmLoading(true);
    try {
      const result = await bpmLookup(a, t);
      if (result.bpm) {
        setBpm(String(result.bpm));
        if (result.key) setMusicalKey(result.key);
        onToast(`BPM updated via ${result.source ?? 'lookup'}`, 'ok');
      } else {
        onToast('No BPM found', 'err');
      }
      bpmUserEdited.current = false;
    } finally {
      setBpmLoading(false);
    }
  }

  const srcCode = SOURCE_CODE[track.source ?? ''] ?? 'yt';

  return (
    <div
      style={{
        background: 'var(--mo-bg-elev)',
        borderRadius: 16,
        boxShadow: '0 0 0 1px var(--mo-accent-ring), 0 0 0 5px var(--mo-accent-tint), var(--mo-shadow-2)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        margin: '0 32px 16px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Source tile */}
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
              boxShadow: '0 0 0 2px var(--mo-bg-elev)',
            }}
          />
        </div>

        {/* URL */}
        <span
          className="mo-mono"
          style={{
            flex: 1,
            fontSize: 11.5,
            color: 'var(--mo-text-3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.url}
        </span>

        {/* Badge */}
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--mo-accent)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          {isEdit ? 'Edit track' : 'New track'}
        </span>

        {/* Shortcut hint */}
        <span style={{ fontSize: 11.5, color: 'var(--mo-text-3)', flexShrink: 0 }}>
          Esc to discard · ⌘↵ to save
        </span>

        {/* Cancel */}
        <button
          onClick={onClose}
          style={{
            height: 30,
            padding: '0 12px',
            borderRadius: 999,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--mo-text-2)',
            fontSize: 13,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          Cancel
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 30,
            padding: '0 16px',
            borderRadius: 999,
            background: 'var(--mo-accent)',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Save track'}
        </button>
      </div>

      {/* Fields row 1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.4fr 1fr .7fr .8fr',
          gap: 12,
        }}
      >
        <div>
          <FieldLabel>Artist</FieldLabel>
          <SoftInput value={artist} onChange={setArtist} placeholder="Artist name" />
        </div>
        <div>
          <FieldLabel hint="Tab 1">Title</FieldLabel>
          <SoftInput value={title} onChange={setTitle} placeholder="Track title" inputRef={titleRef} />
        </div>
        <div>
          <FieldLabel>Genre</FieldLabel>
          <input
            value={genre}
            onChange={e => setGenre(e.target.value)}
            list="inline-genre-list"
            placeholder="e.g. Techno"
            style={{
              width: '100%',
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              background: 'var(--mo-bg-elev)',
              border: 'none',
              outline: 'none',
              boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
              fontSize: 14,
              color: 'var(--mo-text-1)',
              boxSizing: 'border-box',
            }}
          />
          <datalist id="inline-genre-list">
            {genreOptions.map(g => <option key={g} value={g} />)}
          </datalist>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span className="mo-eyebrow">BPM</span>
            {bpmLoading ? (
              <span style={{ fontSize: 10, color: 'var(--mo-text-3)', fontStyle: 'italic' }}>looking up…</span>
            ) : (
              <button
                type="button"
                onClick={handleRefreshBpm}
                title="Refresh BPM / Key"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mo-text-3)',
                  padding: 0,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            )}
          </div>
          <SoftInput value={bpm} onChange={v => { setBpm(v); bpmUserEdited.current = true; }} type="number" placeholder="120" min={40} max={220} />
        </div>
        <div>
          <FieldLabel>Key</FieldLabel>
          <SoftInput value={musicalKey} onChange={setMusicalKey} placeholder="Am, F#m…" />
        </div>
      </div>

      {/* Fields row 2 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        {/* Set position */}
        <div>
          <FieldLabel>Set position</FieldLabel>
          <div
            style={{
              display: 'inline-flex',
              padding: 3,
              borderRadius: 999,
              background: 'var(--mo-bg-sunken)',
              boxShadow: 'inset 0 0 0 1px var(--mo-hairline)',
            }}
          >
            {SET_POSITIONS.map(pos => {
              const active = setPosition === pos;
              return (
                <button
                  key={pos}
                  onClick={() => setSetPosition(prev => prev === pos ? null : pos)}
                  style={{
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'var(--mo-bg-elev)' : 'transparent',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06), 0 0 0 1px var(--mo-hairline-strong)' : 'none',
                    color: active ? 'var(--mo-text-1)' : 'var(--mo-text-2)',
                    fontWeight: 600,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'all .12s',
                    textTransform: 'capitalize',
                  }}
                >
                  <PositionDots value={pos} size={5} />
                  {pos}
                </button>
              );
            })}
          </div>
        </div>

        <span style={{ width: 1, height: 40, background: 'var(--mo-hairline-strong)', flexShrink: 0, alignSelf: 'center' }} />

        <RatingPicker
          label="Intensity"
          hint="1–5"
          value={intensity}
          onChange={setIntensity}
          Visual={IntensityBars}
        />

        <RatingPicker
          label="Score"
          hint="⇧1–5"
          value={score}
          onChange={setScore}
          Visual={ScorePips}
        />

        {isEdit && (
          <div style={{ flex: 1, minWidth: 180 }}>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--mo-bg-elev)',
                border: 'none',
                outline: 'none',
                boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                fontSize: 13.5,
                color: 'var(--mo-text-1)',
                resize: 'none',
                fontFamily: 'var(--mo-font-text)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {isEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={handleDelete}
            style={{
              height: 30,
              padding: '0 12px',
              borderRadius: 999,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mo-danger)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Delete track
          </button>
        </div>
      )}
    </div>
  );
}
