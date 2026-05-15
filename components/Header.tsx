'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userEmail: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight text-white">MOSSA OTTO</h1>
        <span className="text-zinc-500 text-xs uppercase tracking-widest">Music Library</span>
      </div>
      <div className="flex items-center gap-3">
        {userEmail && <span className="text-zinc-500 text-xs hidden sm:block">{userEmail}</span>}
        <button
          onClick={signOut}
          className="text-zinc-400 hover:text-white text-xs border border-zinc-700 hover:border-zinc-500 px-2.5 py-1 rounded transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
