import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Track } from '@/lib/types';
import { LibraryClient } from '@/components/library/LibraryClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--mo-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mo-danger)',
          fontSize: 14,
        }}
      >
        Error loading tracks: {error.message}
      </div>
    );
  }

  return (
    <LibraryClient initialTracks={(tracks ?? []) as Track[]} userEmail={user.email ?? null} />
  );
}
