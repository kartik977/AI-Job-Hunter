# JobHunter AI – ATS Resume Optimizer (100% Free)

Production-ready SaaS that costs **$0 to run** for personal use:

- **No OpenAI** required — built-in local ATS engine (keyword matching, parsing, optimization, cover letters)
- **No Stripe** required — all features unlocked for every user
- **Supabase free tier** — auth, database, file storage (free account at [supabase.com](https://supabase.com))
- **Optional Groq** — free API key from [console.groq.com](https://console.groq.com) for smarter text (still $0 on free tier)
- **Vercel hobby tier** — free hosting

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Auth, PostgreSQL, Storage)
- Local AI + optional Groq / OpenAI

## Quick start

```bash
npm install
cp .env.example .env.local
```

### Supabase (only required service)

1. Create a free project at [supabase.com](https://supabase.com).
2. Run SQL in `supabase/migrations/` (001 then 002) in the SQL Editor.
3. Create a private Storage bucket named **`resumes`**.
4. Enable Email auth (and Google if you want).
5. Auth redirect URL: `http://localhost:3000/auth/callback`
6. Copy URL + anon key + service role key into `.env.local`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI engines (automatic priority)

| Priority | Engine | Cost |
|----------|--------|------|
| 1 (default) | **Local** — keyword ATS, heuristic parse | $0, no API key |
| 2 | **Groq** — if `GROQ_API_KEY` is set | Groq free tier |
| 3 | **OpenAI** — if `OPENAI_API_KEY` is set | Paid (optional) |

## What's included free

- Upload PDF/DOCX → parse → versions
- ATS score vs job description
- Resume optimization
- PDF export
- Cover letters
- Job Kanban tracker
- Team invites (5 seats)

Fair-use caps: 100 analyses/month, 20 resumes (per org) — no payment to lift them.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run test` | Vitest |

## Deploy on Vercel (free)

1. Import repo on [vercel.com](https://vercel.com).
2. Set Supabase env vars only.
3. Skip Stripe and OpenAI unless you want them.

## Optional paid services (not needed)

- Stripe — only if you later want real subscriptions
- OpenAI — only if you prefer GPT over local/Groq
- Upstash — rate limiting (skipped if unset)

## License

Private — All rights reserved.
