# PIA ARFF

Internal app for Pokhara Airport ARFF: a **Mess Finance Tracker** and a **Leave
Information Tracker**. See [docs/PROJECT-DEFINITION.md](docs/PROJECT-DEFINITION.md) for
the full scope, roles, domain model, and billing rules.

## Stack

- **Next.js 16** (App Router, TypeScript, `strict`)
- **Supabase** (Postgres, Auth, Row Level Security)
- **Tailwind CSS**
- ESLint + Prettier

## Project layout

```
PIA/
├─ docs/        # project definition & design docs
├─ pia_app/     # the Next.js application
└─ README.md
```

## Getting started

```bash
cd pia_app
cp .env.example .env.local   # then fill in your Supabase values
npm install
npm run dev                  # http://localhost:3000
```

## Scripts (run inside `pia_app/`)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run format` | Format with Prettier |

## Environment

Copy `pia_app/.env.example` → `pia_app/.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

`.env.local` is gitignored — never commit secrets.
