# Matching Game

Single-player web game: match items from section A to section B, submit your score, and view the top 10 leaderboard. Built with **Next.js**, **Supabase**, and deployable on **Vercel**.

## Game settings

- Leaderboard: **top 10** scores
- Questions: **random** from a pool
- Interaction: **click A**, then **click B**

## Play the game

1. `npm run dev` → [http://localhost:3000](http://localhost:3000)
2. Enter your name → **Start game**
3. Click an item in **Section A**, then its match in **Section B**
4. **Finish** when all pairs are matched — score saves to the top 10 leaderboard

## Step 2 — Database (done)

See **`supabase/README.md`** if you need to re-run SQL.

## Step 1 — Local setup (done)

### 1. Install dependencies

```bash
cd matching-game
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Open **Project Settings → API**
3. Copy **Project URL** and **anon public** key

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The status card should show:

- **Env vars missing** — add `.env.local` and restart
- **Supabase connected** — API works; tables not created yet (normal before Step 2)
- **Supabase ready** — `scores` table exists (after Step 2)

## Project structure

```
src/
  app/              # Next.js routes
  components/       # UI components
  lib/supabase/     # Supabase client + connection check
```

## Push to GitHub

1. Create a new repository on [github.com/new](https://github.com/new) (empty, no README).
2. In this folder:

```powershell
cd c:\Work\matching-game
git remote add origin https://github.com/YOUR_USERNAME/matching-game.git
git branch -M main
git push -u origin main
```

Do **not** commit `.env.local` — it stays local. Use `.env.local.example` as a template.

## Deploy to Vercel (after GitHub)

1. [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.
2. **Before or after first deploy** → Project → **Settings** → **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase **anon public** key
   - Enable for **Production**, **Preview**, and **Development**
3. **Redeploy** (Deployments → ⋯ on latest → **Redeploy**) so env vars apply.

Without these variables the site shows a setup message instead of crashing.

Copy values from Supabase: **Project Settings → API**.
