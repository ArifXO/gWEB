# gWEB

A simple gym workout tracker that works in your phone's browser and installs on your home screen. Plan your week, log sets with one tap, and see your progress. Accounts and sync come from Supabase, so your data follows you between devices and each of your friends gets their own private account.

## What's in it

- **Home**: this week at a glance and today's workout, with one big Start button.
- **Plan**: routines (like "Push" or "Legs") assigned to weekdays, plus three ready-made plans to start from.
- **Workout**: every exercise on one scrolling screen. Weight and reps are filled in from last time, and you can type or tap − / +. Tick a set to start the rest timer automatically. The app suggests adding weight when you hit every rep last time and flags new bests.
- **History**: past workouts that you can open, edit, re-date or delete.
- **Progress**: a body map of what you trained this week, weight lifted per week, and your best set plus a chart for each lift.
- **Settings**: kg or lb, default rest time, sync status, and backup export or import.
- **Exercise library**: 840+ exercises. Each one has an animated figure showing the movement, the muscles it works, written steps, and your own history with it. You can swap an exercise mid-workout, for example when a machine is taken.
- **Body weight** log with a trend line, a **training calendar**, and **Do this workout again** from History.
- **Sign in with Google** or email.

It works offline. Changes are kept on the phone and sync when you're back online. When two devices edit the same thing, the newest edit wins.

## Set it up (about 10 minutes, one time)

You need free accounts on **Supabase** (database and logins) and **Vercel** (hosting). Neither needs a card for this.

### 1. Supabase

1. Go to [supabase.com](https://supabase.com), sign in with GitHub and click **New project**. Choose any name and a strong database password, and pick the region closest to you.
2. When it's ready, open **SQL Editor → New query**. Paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It should say "Success. No rows returned".
3. Open **Project Settings → API** (called **API Keys** in newer dashboards). Keep the tab open, because you'll need two values from it:
   - **Project URL**, which looks like `https://abcd1234.supabase.co`
   - the **anon / public** key (newer dashboards call it the **publishable** key). Don't use the `service_role` or secret key.

### 2. Vercel

1. Go to [vercel.com](https://vercel.com), sign in with GitHub and click **Add New → Project**. Import **gWEB**.
2. Vercel detects Vite on its own. Before you click Deploy, open **Environment Variables** and add these two:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon / publishable key
3. Click **Deploy**. You get a link like `https://gweb-xxxx.vercel.app`.

### 3. Tell Supabase where the app lives

In Supabase, go to **Authentication → URL Configuration**:

- set **Site URL** to your Vercel link
- under **Redirect URLs**, add `https://<your-vercel-link>/**`

This makes the "confirm your email" and "reset password" links open your app.

For **Sign in with Google**, turn on the Google provider in **Authentication → Sign In / Providers → Google** and paste in a Client ID and secret from Google Cloud (APIs & Services → Credentials → OAuth client ID, type "Web application", with the authorized redirect URI that Supabase shows on that page).

Optional: if you don't want new accounts to confirm their email first, turn off **Authentication → Sign In / Providers → Email → Confirm email**.

### 4. On your phone

Open the Vercel link, create an account, then add the app to your home screen. On iPhone, open it in Safari and tap Share → Add to Home Screen. On Android, open it in Chrome and tap ⋮ → Add to Home screen (or Install app).

Friends can open the same link and make their own accounts. Nobody can see anyone else's data, because the database only returns your own rows.

## Develop

```bash
npm install
cp .env.example .env.local   # fill in the two values, or leave empty for device-only mode
npm run dev                  # http://localhost:5173
npm test                     # unit tests for the training logic and sync merge
npm run build
```

Without the two environment variables, the app runs in device-only mode: there's no login and data stays in that browser.

## How it's built

- React 19, TypeScript, Vite and Tailwind CSS 4. State lives in Zustand and is saved to the browser's storage.
- `src/lib/store.ts` holds all data. Every routine, workout and custom exercise is a record with an `updatedAt` time, and deletions are kept as markers so they sync too.
- `src/lib/sync.ts` pushes local changes and pulls newer ones from Supabase's `records` table. The `push_records` function never lets an older edit overwrite a newer one.
- `public/sw.js` is a small service worker that keeps the app opening offline.
- The exercise library combines our own list of common lifts (`src/lib/catalogue.ts`) with [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), which is public domain (Unlicense). `tools/build-library.py` converts it.
- The exercise animations (`src/components/anim`) are original. A side-view figure is drawn from smooth shapes and posed by a few key poses per exercise; knees and elbows are solved with simple inverse kinematics. The 101 most common exercises each have their own clip in `anim/clips` (equipment, rep timing and working muscles included). Every other exercise borrows the clip of the closest common lift (`anim/clips/index.ts`). To add one, write a `makeClip({ keys, steps, hot })` and add it to `OWN`.
- The body map (`src/components/BodyMap.tsx`) and the icons were drawn for this project.
- `npm run build:demo` builds `demo.html`, a no-login version with sample data, for previews.

Design notes are in [docs/DESIGN.md](docs/DESIGN.md).
