'use client';

import { useState } from 'react';
import type { FilterState, SetPosition, SortKey } from '@/lib/types';
import { PositionDots, IntensityBars, ScorePips, SourceDot } from '@/components/primitives';

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  genreOptions: string[];
  shown: number;
  total: number;
  queue: number;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'score_desc', label: 'Score ↓' },
  { value: 'intensity_desc', label: 'Intensity ↓' },
  { value: 'bpm_asc', label: 'BPM ↑' },
  { value: 'bpm_desc', label: 'BPM ↓' },
  { value: 'title_az', label: 'Title A–Z' },
];

const SET_POSITIONS: SetPosition[] = ['open', 'middle', 'close'];

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

// Chip button
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 28,
        padding: '0 12px',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'var(--mo-accent-tint)' : 'transparent',
        color: active ? 'var(--mo-accent)' : 'var(--mo-text-2)',
        boxShadow: active
          ? 'inset 0 0 0 1px var(--mo-accent-ring)'
          : 'inset 0 0 0 1px var(--mo-hairline-strong)',
        fontWeight: 500,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all .12s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// Stepper pill
function StepperPill({
  label,
  value,
  max,
  onIncrease,
  onDecrease,
  children,
}: {
  label: string;
  value: number | null;
  max: number;
  onIncrease: () => void;
  onDecrease: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 8px 0 12px',
        height: 32,
        borderRadius: 999,
        background: 'var(--mo-bg-elev)',
        boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--mo-text-3)', whiteSpace: 'nowrap' }}>{label}</span>
      {children}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button
          onClick={onIncrease}
          disabled={value !== null && value >= max}
          style={{
            width: 16,
            height: 14,
            border: 'none',
            background: 'transparent',
            cursor: value !== null && value >= max ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mo-text-3)',
            padding: 0,
          }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 6l4-4 4 4" />
          </svg>
        </button>
        <button
          onClick={onDecrease}
          disabled={value === null}
          style={{
            width: 16,
            height: 14,
            border: 'none',
            background: 'transparent',
            cursor: value === null ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mo-text-3)',
            padding: 0,
          }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 2l4 4 4-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function FilterBar({ filters, onChange, genreOptions, shown, total, queue }: FilterBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const isDefault =
    filters.status === 'all' &&
    filters.source === 'all' &&
    filters.setPosition.length === 0 &&
    filters.minIntensity === null &&
    filters.minScore === null &&
    filters.search === '' &&
    filters.genre === '' &&
    filters.sort === 'newest';

  const currentSort = SORT_OPTIONS.find(o => o.value === filters.sort)?.label ?? 'Newest first';

  // Source options
  const sourceOptions: { value: FilterState['source']; label: React.ReactNode }[] = [
    { value: 'all', label: 'All' },
    { value: 'youtube', label: <SourceDot src="yt" size={6} /> },
    { value: 'spotify', label: <SourceDot src="sp" size={6} /> },
    { value: 'soundcloud', label: <SourceDot src="sc" size={6} /> },
    { value: 'bandcamp', label: <SourceDot src="bc" size={6} /> },
  ];

  return (
    <div style={{ padding: '0 32px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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

        {/* Divider */}
        <span style={{ width: 1, height: 16, background: 'var(--mo-hairline-strong)', flexShrink: 0 }} />

        {/* Source segmented */}
        <Segmented
          value={filters.source}
          onChange={v => onChange({ source: v })}
          options={sourceOptions}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Sort dropdown */}
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
                appearance: 'none',
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
              {SORT_OPTIONS.map(o => (
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
          {/* Hidden display label */}
          <span style={{ display: 'none' }}>{currentSort}</span>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Position label */}
        <span className="mo-eyebrow" style={{ flexShrink: 0 }}>Position</span>

        {/* Position chips */}
        {SET_POSITIONS.map(pos => (
          <Chip
            key={pos}
            active={filters.setPosition.includes(pos)}
            onClick={() => {
              const cur = filters.setPosition;
              onChange({ setPosition: cur.includes(pos) ? cur.filter(x => x !== pos) : [...cur, pos] });
            }}
          >
            <PositionDots value={pos} size={5} />
            <span style={{ textTransform: 'capitalize' }}>{pos}</span>
          </Chip>
        ))}

        {/* Divider */}
        <span style={{ width: 1, height: 16, background: 'var(--mo-hairline-strong)', flexShrink: 0 }} />

        {/* Intensity stepper */}
        <StepperPill
          label="Intensity ≥"
          value={filters.minIntensity}
          max={5}
          onIncrease={() => {
            const cur = filters.minIntensity ?? 0;
            if (cur < 5) onChange({ minIntensity: cur + 1 });
          }}
          onDecrease={() => {
            const cur = filters.minIntensity ?? 1;
            if (cur <= 1) onChange({ minIntensity: null });
            else onChange({ minIntensity: cur - 1 });
          }}
        >
          <IntensityBars value={filters.minIntensity ?? 0} size="sm" />
        </StepperPill>

        {/* Score stepper */}
        <StepperPill
          label="Score ≥"
          value={filters.minScore}
          max={5}
          onIncrease={() => {
            const cur = filters.minScore ?? 0;
            if (cur < 5) onChange({ minScore: cur + 1 });
          }}
          onDecrease={() => {
            const cur = filters.minScore ?? 1;
            if (cur <= 1) onChange({ minScore: null });
            else onChange({ minScore: cur - 1 });
          }}
        >
          <ScorePips value={filters.minScore ?? 0} size="sm" />
        </StepperPill>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--mo-text-3)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search title, artist, genre…"
            style={{
              width: '100%',
              height: 32,
              paddingLeft: 30,
              paddingRight: 12,
              borderRadius: 999,
              background: 'var(--mo-bg-elev)',
              border: 'none',
              outline: 'none',
              boxShadow: searchFocused
                ? '0 0 0 1px var(--mo-accent-ring), 0 0 0 3px var(--mo-accent-tint)'
                : 'inset 0 0 0 1px var(--mo-hairline-strong)',
              fontSize: 12.5,
              color: 'var(--mo-text-1)',
              boxSizing: 'border-box',
              transition: 'box-shadow .15s',
            }}
          />
        </div>

        {/* Genre datalist (hidden input for suggestions) */}
        {genreOptions.length > 0 && (
          <>
            <input
              type="text"
              value={filters.genre}
              onChange={e => onChange({ genre: e.target.value })}
              list="filter-genre-list"
              placeholder="Genre…"
              style={{
                width: 100,
                height: 32,
                padding: '0 12px',
                borderRadius: 999,
                background: 'var(--mo-bg-elev)',
                border: 'none',
                outline: 'none',
                boxShadow: 'inset 0 0 0 1px var(--mo-hairline-strong)',
                fontSize: 12.5,
                color: 'var(--mo-text-1)',
                flexShrink: 0,
              }}
            />
            <datalist id="filter-genre-list">
              {genreOptions.map(g => <option key={g} value={g} />)}
            </datalist>
          </>
        )}

        {/* Clear filters */}
        {!isDefault && (
          <button
            onClick={() => onChange({
              status: 'all', source: 'all', setPosition: [],
              minIntensity: null, minScore: null, search: '', genre: '', sort: 'newest',
            })}
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
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
