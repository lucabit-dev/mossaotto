'use client';

import { cn } from '@/lib/utils';
import type { FilterState, SetPosition, SortKey } from '@/lib/types';

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  genreOptions: string[];
  shown: number;
  total: number;
  queue: number;
}

const SET_POSITIONS: SetPosition[] = ['open', 'middle', 'close'];
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'score_desc', label: 'Score ↓' },
  { value: 'intensity_desc', label: 'Intensity ↓' },
  { value: 'bpm_asc', label: 'BPM ↑' },
  { value: 'bpm_desc', label: 'BPM ↓' },
  { value: 'title_az', label: 'Title A–Z' },
];

function Chip({
  label, active, onClick, color = 'fuchsia',
}: {
  label: string; active: boolean; onClick: () => void; color?: 'fuchsia' | 'zinc';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded text-xs font-medium border transition-colors whitespace-nowrap',
        active
          ? color === 'fuchsia'
            ? 'bg-fuchsia-600 border-fuchsia-500 text-white'
            : 'bg-zinc-600 border-zinc-500 text-white'
          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
      )}
    >
      {label}
    </button>
  );
}

export function FilterBar({ filters, onChange, genreOptions, shown, total, queue }: FilterBarProps) {
  const isDefault =
    filters.status === 'all' &&
    filters.source === 'all' &&
    filters.setPosition.length === 0 &&
    filters.minIntensity === null &&
    filters.minScore === null &&
    filters.search === '' &&
    filters.genre === '' &&
    filters.sort === 'newest';

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-3 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status */}
        <span className="text-zinc-500 text-xs mr-1 hidden sm:inline">Status:</span>
        {(['all', 'queue', 'downloaded'] as const).map(s => (
          <Chip key={s} label={s === 'all' ? 'All' : s === 'queue' ? 'DL queue' : 'Downloaded'}
            active={filters.status === s} onClick={() => onChange({ status: s })} />
        ))}

        <span className="text-zinc-700 hidden sm:inline">|</span>

        {/* Source */}
        <span className="text-zinc-500 text-xs mr-1 hidden sm:inline">Source:</span>
        {(['all', 'youtube', 'spotify', 'soundcloud', 'bandcamp'] as const).map(s => (
          <Chip key={s} label={s === 'all' ? 'All' : s === 'youtube' ? 'YT' : s === 'spotify' ? 'SP' : s === 'soundcloud' ? 'SC' : 'BC'}
            active={filters.source === s} onClick={() => onChange({ source: s })} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Set position */}
        <span className="text-zinc-500 text-xs mr-1 hidden sm:inline">Pos:</span>
        {SET_POSITIONS.map(p => (
          <Chip key={p} label={p} color="zinc"
            active={filters.setPosition.includes(p)}
            onClick={() => {
              const cur = filters.setPosition;
              onChange({ setPosition: cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p] });
            }} />
        ))}

        <span className="text-zinc-700 hidden sm:inline">|</span>

        {/* Intensity */}
        <span className="text-zinc-500 text-xs mr-1 hidden sm:inline">Intensity:</span>
        {[null, 2, 3, 4, 5].map(v => (
          <Chip key={String(v)} label={v === null ? 'Any' : `≥${v}`}
            active={filters.minIntensity === v}
            onClick={() => onChange({ minIntensity: v })} />
        ))}

        <span className="text-zinc-700 hidden sm:inline">|</span>

        {/* Score */}
        <span className="text-zinc-500 text-xs mr-1 hidden sm:inline">Score:</span>
        {[null, 2, 3, 4, 5].map(v => (
          <Chip key={String(v)} label={v === null ? 'Any' : `≥${v}`}
            active={filters.minScore === v}
            onClick={() => onChange({ minScore: v })} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <input
          type="text"
          value={filters.search}
          onChange={e => onChange({ search: e.target.value })}
          placeholder="Search title / artist / genre…"
          className="flex-1 min-w-40 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
        />

        {/* Genre */}
        <input
          type="text"
          value={filters.genre}
          onChange={e => onChange({ genre: e.target.value })}
          list="filter-genre-list"
          placeholder="Genre…"
          className="w-32 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
        />
        <datalist id="filter-genre-list">
          {genreOptions.map(g => <option key={g} value={g} />)}
        </datalist>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => onChange({ sort: e.target.value as SortKey })}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {!isDefault && (
          <button
            onClick={() => onChange({ status: 'all', source: 'all', setPosition: [], minIntensity: null, minScore: null, search: '', genre: '', sort: 'newest' })}
            className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2.5 py-1.5 rounded transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-zinc-500">
        <span className="text-zinc-300">{shown}</span> shown ·{' '}
        <span className="text-zinc-300">{total}</span> total ·{' '}
        <span className="text-fuchsia-400">{queue}</span> in queue
      </div>
    </div>
  );
}
