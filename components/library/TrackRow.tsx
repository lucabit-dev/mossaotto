'use client';

import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TrackRowProps {
  track: Track;
  onClick: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

const SOURCE_MAP: Record<string, { label: string; cls: string }> = {
  youtube:    { label: 'YT',  cls: 'bg-red-900/60 text-red-300 border-red-800' },
  spotify:    { label: 'SP',  cls: 'bg-green-900/60 text-green-300 border-green-800' },
  soundcloud: { label: 'SC',  cls: 'bg-orange-900/60 text-orange-300 border-orange-800' },
  bandcamp:   { label: 'BC',  cls: 'bg-teal-900/60 text-teal-300 border-teal-800' },
  other:      { label: '?',   cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
};

export function TrackRow({ track, onClick, onToast }: TrackRowProps) {
  const supabase = createClient();
  const { label, cls } = SOURCE_MAP[track.source] ?? SOURCE_MAP.other;

  async function toggleDownloaded(e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from('tracks')
      .update({ downloaded: !track.downloaded })
      .eq('id', track.id);
    if (error) onToast(error.message, 'err');
    else onToast(track.downloaded ? 'Marked as not downloaded' : 'Marked as downloaded', 'ok');
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/40 transition-colors group',
        track.downloaded && 'opacity-40'
      )}
    >
      {/* Artwork */}
      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
        {track.artwork_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.artwork_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
            {label}
          </div>
        )}
      </div>

      {/* Source badge */}
      <span className={cn('text-xs px-1.5 py-0.5 rounded border font-mono flex-shrink-0 hidden sm:inline', cls)}>{label}</span>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-white text-sm font-medium truncate">{track.title ?? '—'}</span>
          {track.artist && <span className="text-zinc-400 text-xs truncate flex-shrink-0">{track.artist}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {track.genre && <Chip label={track.genre} />}
          {track.bpm && <Chip label={`${track.bpm} BPM`} />}
          {track.musical_key && <Chip label={track.musical_key} />}
          {track.intensity && <Chip label={`I:${track.intensity}`} color="fuchsia" />}
          {track.score && <Chip label={'★'.repeat(track.score)} color="amber" />}
          {track.set_position.map(p => <Chip key={p} label={p} color="zinc" />)}
          {track.added_by && (
            <span className="text-zinc-600 text-xs truncate">{track.added_by.split('@')[0]}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <a
          href={track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-200 text-xs border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded transition-colors"
          title="Open in source"
        >
          ↗
        </a>
        <button
          onClick={toggleDownloaded}
          className={cn(
            'text-xs border px-2 py-1 rounded transition-colors',
            track.downloaded
              ? 'text-green-400 border-green-800 hover:border-green-600'
              : 'text-zinc-400 border-zinc-700 hover:border-fuchsia-600 hover:text-fuchsia-400'
          )}
          title={track.downloaded ? 'Mark as not downloaded' : 'Mark as downloaded'}
        >
          {track.downloaded ? '✓' : '↓'}
        </button>
      </div>
    </div>
  );
}

function Chip({ label, color = 'default' }: { label: string; color?: 'default' | 'fuchsia' | 'amber' | 'zinc' }) {
  const cls = {
    default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    fuchsia: 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-800',
    amber:   'bg-amber-900/40 text-amber-300 border-amber-800',
    zinc:    'bg-zinc-700/60 text-zinc-300 border-zinc-600',
  }[color];
  return <span className={cn('text-xs px-1.5 py-0.5 rounded border', cls)}>{label}</span>;
}
