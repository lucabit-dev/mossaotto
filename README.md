# MOSSA OTTO — Music Library

A shared track library for the DJ duo MOSSA OTTO. Both DJs paste URLs from YouTube, Spotify, or SoundCloud, tag each track (genre, intensity, BPM, key, set position, score, notes), and see each other's additions in real time. The app never plays audio — its job is capture → tag → shared library → Soulseek export queue. When prepping a download session, filter to the queue, copy the Soulseek search list (one `Artist - Title` per line), download in high quality, then mark tracks as downloaded.

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then open the **SQL Editor** and paste the entire contents of `supabase/schema.sql`. Run it. This creates the `tracks` table, indexes, RLS policies, and enables realtime.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your project's values from **Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Add users

In the Supabase dashboard go to **Authentication → Users → Invite user**. Magic-link email auth is used — no passwords. Signup can also be enabled for self-service.

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll be redirected to `/auth/login` — enter your email to receive a magic link.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. In **Supabase → Authentication → URL Configuration**, add your Vercel production URL (e.g. `https://mossa-otto.vercel.app`) and any preview URLs to **Redirect URLs** so magic links work outside localhost.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Invalid URL path` error on startup | Check `NEXT_PUBLIC_SUPABASE_URL` — it must be `https://xxx.supabase.co` with no trailing slash |
| Magic link not arriving | Check spam folder; free Supabase projects have an SMTP rate limit of 4 emails/hour — use a custom SMTP in project settings for production |
| Realtime not updating | Re-run the `alter publication supabase_realtime add table tracks` line from `schema.sql` in the SQL Editor |
| Auth callback fails in production | Confirm the production URL is added to Redirect URLs in Supabase Auth settings |
| 403 errors on DB operations | RLS policies require an authenticated session — make sure you're signed in |

## BPM and key auto-fetch

When you paste a URL and the dialog opens, MOSSA OTTO automatically looks up BPM (and key when available) in the background — you don't need to do anything.

**How the lookup cascade works:**

1. **Deezer** (free, no key required) — covers most mainstream electronic releases. Returns BPM only.
2. **GetSongBPM** (optional, requires API key) — fills gaps when Deezer has no BPM. Also returns musical key. **Deploy first**, then request a key at [getsongbpm.com/api](https://getsongbpm.com/api): use your live URL (e.g. `https://mossaotto.vercel.app`) as Website URL and Backlink URL — the app footer links to GetSongBPM (required). Add the key as `GETSONGBPM_API_KEY`.
3. **Manual** — white labels, edits, and unreleased tracks that neither service recognises stay manual. The BPM and key fields remain blank and you can type directly.

**"Refresh BPM/Key" button** — available in both the edit dialog (next to the BPM label) and on each row (appears on hover). Use it to retroactively fill in tracks saved without BPM, or after correcting a misspelled artist name.

**Vercel deployment:** Add `GETSONGBPM_API_KEY` in your project's **Environment Variables** (Production + Preview) if you want the GetSongBPM fallback. The app works fine without it — Deezer alone covers most tracks.

> **Attribution:** The app footer includes the required [GetSongBPM](https://getsongbpm.com) backlink on every page. Their signup checker crawls your live site — if you see "Backlink is missing", deploy the latest code and wait a minute before resubmitting.
