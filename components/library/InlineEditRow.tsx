'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track, SetPosition } from '@/lib/types';
import { ScorePips, IntensityBars } from '@/components/primitives';
import { bpmLookup } from '@/lib/lookup';

type IntensityScore = 1 | 2 | 3 | 4 | 5;

function StepperGrid<T extends number>({
  value,
  onChange,
  renderCell,
}: {
  value: T | null;
  onChange: (v: T | null) => void;
  renderCell: (n: T) => React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
      {([1, 2, 3, 4, 5] as T[]).map(n => {
        const on = n === value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(on ? null : n)}
            style={{
              height: 40,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: on ? 'var(--mo-accent-tint-strong, var(--mo-accent-tint))' : 'var(--mo-bg-elev)',
              boxShadow: on
                ? 'inset 0 0 0 1px var(--mo-accent-ring)'
                : 'inset 0 0 0 1px var(--mo-hairline-strong)',
              color: on ? 'var(--mo-accent)' : 'var(--mo-text-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              fontWeight: on ? 700 : 500,
              transition: 'all .12s',
            }}
          >
            {renderCell(n)}
          </button>
        );
      })}
    </div>
  );
}

interface InlineEditRowProps {
  track: Partial<Track>;
  genreOptions: string[];
  userEmail: string | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  onSaved: (track: Track) => void;
  onDeleted?: (id: string) => void;
  isMobile?: boolean;
}

const SET_POSITIONS: SetPosition[] = ['open', 'middle', 'close'];

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

export function InlineEditRow({ track, genreOptions, userEmail, onClose, onToast, onSaved, onDeleted, isMobile = false }: InlineEditRowProps) {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const bpmUserEdited = useRef(false);
  const showDeleteConfirmRef = useRef(false);
  useEffect(() => { showDeleteConfirmRef.current = showDeleteConfirm; }, [showDeleteConfirm]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        if (showDeleteConfirmRef.current) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
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

    const { data, error } = isEdit
      ? await supabase.from('tracks').update(payload).eq('id', track.id!).select().single()
      : await supabase.from('tracks').insert(payload).select().single();

    setSaving(false);
    if (error) {
      if (error.code === '23505') onToast('URL already in library', 'err');
      else onToast(error.message, 'err');
    } else {
      onSaved(data as Track);
      onToast(isEdit ? 'Track updated' : 'Track saved', 'ok');
      onClose();
    }
  }

  function handleDelete() {
    if (!track.id) return;
    setShowDeleteConfirm(true);
  }

  async function doDelete() {
    if (!track.id) return;
    setShowDeleteConfirm(false);
    const { error } = await supabase.from('tracks').delete().eq('id', track.id);
    if (error) onToast(error.message, 'err');
    else {
      onDeleted?.(track.id);
      onToast('Track deleted');
      onClose();
    }
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

  // --- Delete confirmation modal (shared between desktop and mobile) ---
  const deleteModal = showDeleteConfirm && (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => setShowDeleteConfirm(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 11, 14, 0.5)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'var(--mo-bg-elev)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          boxShadow: 'var(--mo-shadow-3), inset 0 0 0 1px var(--mo-hairline)',
          maxWidth: 360,
          width: 'calc(100% - 48px)',
          animation: 'mo-modal-in 0.22s cubic-bezier(.2,.8,.4,1)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(215,38,61,.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--mo-danger)" strokeWidth="1.8">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h3
          id="delete-modal-title"
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--mo-text-1)',
            letterSpacing: '-0.015em',
            marginBottom: 8,
          }}
        >
          Delete track?
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--mo-text-2)', lineHeight: 1.55, marginBottom: 24 }}>
          {track.title ? (
            <>
              <strong style={{ color: 'var(--mo-text-1)', fontWeight: 600 }}>{track.title}</strong>
              {' '}will be permanently removed from the shared library.
            </>
          ) : (
            'This track will be permanently removed from the shared library.'
          )}
          {' '}This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 999,
              background: 'var(--mo-bg-sunken)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mo-text-1)',
              fontSize: 13.5,
              fontWeight: 500,
              boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={doDelete}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 999,
              background: 'var(--mo-danger)',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Delete track
          </button>
        </div>
      </div>
    </div>
  );

  // --- Mobile bottom sheet layout ---
  if (isMobile) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,11,14,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'relative', zIndex: 1, background: 'var(--mo-bg-elev)',
            borderRadius: '22px 22px 0 0', padding: 0,
            boxShadow: 'var(--mo-shadow-3)',
            animation: 'mo-sheet-in 0.28s cubic-bezier(.2,.8,.4,1)',
            maxHeight: '92vh', overflowY: 'auto',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--mo-hairline-xstrong)' }} />
            </div>
            {/* Compact header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', borderBottom: '1px solid var(--mo-hairline)' }}>
              {/* Source tile */}
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--mo-bg-sunken)', boxShadow: 'inset 0 0 0 1px var(--mo-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mo-text-3)" strokeWidth="1.6">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span style={{
                  position: 'absolute', right: -2, bottom: -2, width: 9, height: 9, borderRadius: '50%',
                  background: srcCode === 'yt' ? 'var(--mo-src-yt)' : srcCode === 'sp' ? 'var(--mo-src-sp)' : srcCode === 'sc' ? 'var(--mo-src-sc)' : 'var(--mo-src-bc)',
                  boxShadow: '0 0 0 2px var(--mo-bg-elev)',
                }} />
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--mo-accent)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', flexShrink: 0 }}>
                {isEdit ? 'Edit track' : 'New track'}
              </span>
              <span className="mo-mono" style={{ flex: 1, fontSize: 11, color: 'var(--mo-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {track.url}
              </span>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--mo-bg-sunken)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mo-text-3)', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {/* Fields stacked for mobile */}
            <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Artist + Title row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <FieldLabel>Artist</FieldLabel>
                  <SoftInput value={artist} onChange={setArtist} placeholder="Artist name" />
                </div>
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <SoftInput value={title} onChange={setTitle} placeholder="Track title" inputRef={titleRef} />
                </div>
              </div>
              {/* Genre + BPM + Key row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <FieldLabel>Genre</FieldLabel>
                  <input value={genre} onChange={e => setGenre(e.target.value)} list="mobile-genre-list" placeholder="Techno"
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 10, background: 'var(--mo-bg-elev)', border: 'none', outline: 'none', boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)', fontSize: 13, color: 'var(--mo-text-1)', boxSizing: 'border-box' as const }} />
                  <datalist id="mobile-genre-list">{genreOptions.map(g => <option key={g} value={g} />)}</datalist>
                </div>
                <div>
                  <FieldLabel>BPM</FieldLabel>
                  <SoftInput value={bpm} onChange={v => { setBpm(v); bpmUserEdited.current = true; }} type="number" placeholder="120" />
                </div>
                <div>
                  <FieldLabel>Key</FieldLabel>
                  <SoftInput value={musicalKey} onChange={setMusicalKey} placeholder="Am" />
                </div>
              </div>
              {/* Set position */}
              <div>
                <FieldLabel>Set position</FieldLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['open', 'middle', 'close'] as SetPosition[]).map(pos => {
                    const active = setPosition === pos;
                    return (
                      <button key={pos} type="button" onClick={() => setSetPosition(prev => prev === pos ? null : pos)}
                        style={{
                          flex: 1, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: active ? 'var(--mo-accent-tint)' : 'var(--mo-bg-elev)',
                          color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
                          boxShadow: active ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                          fontWeight: 600, fontSize: 13.5, textTransform: 'capitalize' as const, transition: 'all .12s',
                        }}>
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Intensity stepper */}
              <div>
                <FieldLabel>Intensity</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {([1, 2, 3, 4, 5] as IntensityScore[]).map(n => {
                    const on = n === intensity;
                    return (
                      <button key={n} type="button" onClick={() => setIntensity(on ? null : n)}
                        style={{
                          height: 48, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: on ? 'var(--mo-accent-tint-strong, var(--mo-accent-tint))' : 'var(--mo-bg-elev)',
                          boxShadow: on ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
                        }}>
                        <IntensityBars value={n} size="sm" />
                        <span style={{ fontSize: 11, color: on ? 'var(--mo-accent)' : 'var(--mo-text-3)', fontWeight: on ? 700 : 500 }}>{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Score stepper */}
              <div>
                <FieldLabel>Score</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {([1, 2, 3, 4, 5] as IntensityScore[]).map(n => {
                    const on = n === score;
                    return (
                      <button key={n} type="button" onClick={() => setScore(on ? null : n)}
                        style={{
                          height: 48, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: on ? 'var(--mo-accent-tint-strong, var(--mo-accent-tint))' : 'var(--mo-bg-elev)',
                          boxShadow: on ? 'inset 0 0 0 1px var(--mo-accent-ring)' : 'inset 0 0 0 1px var(--mo-hairline-strong)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
                        }}>
                        <ScorePips value={n} size="sm" />
                        <span style={{ fontSize: 11, color: on ? 'var(--mo-accent)' : 'var(--mo-text-3)', fontWeight: on ? 700 : 500 }}>{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {isEdit && (
                <button onClick={handleDelete} style={{ height: 40, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--mo-danger)', fontSize: 14, fontWeight: 500, textAlign: 'left' as const }}>
                  Delete track
                </button>
              )}
            </div>
            {/* Sticky save button */}
            <div style={{ padding: '0 16px 32px', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ width: '100%', height: 52, borderRadius: 14, background: 'var(--mo-accent)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {saving ? 'Saving…' : isEdit ? 'Update track' : 'Save track'}
              </button>
            </div>
          </div>
        </div>
        {deleteModal}
      </>
    );
  }

  // --- Desktop layout ---
  return (
    <>
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

        {/* Scoring section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
            paddingTop: 16,
            borderTop: '1px dashed var(--mo-hairline-strong)',
          }}
        >
          {/* Set position */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="mo-eyebrow">Set position</span>
              <span style={{ fontSize: 10, color: 'var(--mo-text-3)', fontFamily: 'var(--mo-font-mono)' }}>O M C</span>
            </div>
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
                const idx = ({ open: 0, middle: 1, close: 2 } as Record<string, number>)[pos];
                return (
                  <button
                    key={pos}
                    onClick={() => setSetPosition(prev => prev === pos ? null : pos)}
                    style={{
                      height: 34,
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
                      fontSize: 13,
                      fontFamily: 'var(--mo-font-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all .12s',
                      textTransform: 'capitalize',
                    }}
                  >
                    <span style={{ display: 'inline-flex', gap: 3 }}>
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
            </div>
          </div>

          {/* Intensity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="mo-eyebrow">Intensity</span>
              <span style={{ fontSize: 10, color: 'var(--mo-text-3)', fontFamily: 'var(--mo-font-mono)' }}>1–5</span>
            </div>
            <StepperGrid
              value={intensity}
              onChange={setIntensity}
              renderCell={n => (
                <>
                  <IntensityBars value={n} size="sm" />
                  <span style={{ fontSize: 11, lineHeight: 1 }}>{n}</span>
                </>
              )}
            />
          </div>

          {/* Score */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="mo-eyebrow">Score</span>
              <span style={{ fontSize: 10, color: 'var(--mo-text-3)', fontFamily: 'var(--mo-font-mono)' }}>⇧1–5</span>
            </div>
            <StepperGrid
              value={score}
              onChange={setScore}
              renderCell={n => (
                <>
                  <ScorePips value={n} size="sm" />
                  <span style={{ fontSize: 11, lineHeight: 1 }}>{n}</span>
                </>
              )}
            />
          </div>
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
      {deleteModal}
    </>
  );
}
