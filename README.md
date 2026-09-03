# Kellyn Hub

Kellyn Hub is a private personal learning and organisation web application for Kellyn’s Sixth Form Year 2 and university preparation.

## Current build

The repository now contains the working application rather than a placeholder shell.

Main areas:

- Today dashboard
- Subjects
- My Work with persistent tasks and step plans
- Secure file uploads
- Planner, timetable and travel setup
- Mock & Practice records
- UCAS evidence bank and personal statement support boundaries
- University research tracker
- My Progress
- WJEC resources and NotebookLM prompt support
- I’m Stuck support flow
- Quick Capture
- Accessibility settings including OpenDyslexic, text size, Read Aloud, Focus Mode, dark mode and reduced motion
- Independent living skills tracker

## Architecture

- **Source control:** GitHub
- **Hosting:** Vercel
- **Authentication, database and private file storage:** Supabase
- **WJEC resource library:** `dlbeadle78/kellynwjec`
- **Frontend:** React + Vite

The app uses the existing Supabase project and Row Level Security. The publishable browser key is not a secret. No service-role key, password or private token is committed.

## Local development

```bash
npm install
npm run dev
```

Optional environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The existing Kellyn Hub project values are used as safe publishable fallbacks so the connected Vercel deployment can run without a service secret.

## Build

```bash
npm run build
```

Vercel should detect Vite automatically. `vercel.json` keeps the single-page application routes working.

## Personal data

Do not commit school timetable entries, travel routines, tasks, uploaded schoolwork, notes or other private records to GitHub. Add them inside the authenticated application so they remain in Supabase.

## AI boundary

Kellyn Hub may help explain, simplify, plan, quiz, support reflection and review work Kellyn has already produced. It must not write assessed coursework, fabricate evidence or create a personal statement for direct submission.
