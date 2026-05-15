export type Source = 'youtube' | 'spotify' | 'soundcloud' | 'bandcamp' | 'other';
export type SetPosition = 'open' | 'middle' | 'close';

export interface Track {
  id: string;
  url: string;
  source: Source;
  title: string | null;
  artist: string | null;
  artwork_url: string | null;
  duration_seconds: number | null;
  bpm: number | null;
  musical_key: string | null;
  genre: string | null;
  intensity: 1 | 2 | 3 | 4 | 5 | null;
  set_position: SetPosition[];
  score: 1 | 2 | 3 | 4 | 5 | null;
  notes: string | null;
  downloaded: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OEmbedResult {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  duration?: number;
}

export type SortKey = 'newest' | 'oldest' | 'score_desc' | 'intensity_desc' | 'bpm_asc' | 'bpm_desc' | 'title_az';

export interface FilterState {
  status: 'all' | 'queue' | 'downloaded';
  source: 'all' | Source;
  setPosition: SetPosition[];
  minIntensity: number | null;
  minScore: number | null;
  search: string;
  genre: string;
  sort: SortKey;
}
