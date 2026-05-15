import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Track } from '@/lib/types';
import { Header } from '@/components/Header';
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-400 text-sm">
        Error loading tracks: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <Header userEmail={user.email ?? null} />
      <LibraryClient initialTracks={(tracks ?? []) as Track[]} userEmail={user.email ?? null} />
    </div>
  );
}
