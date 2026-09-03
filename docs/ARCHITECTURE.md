# Kellyn Hub Architecture

## Purpose

Keep Kellyn Hub independent of any single AI builder or hosting platform. GitHub is the permanent source of truth for the application code.

## Intended stack

- Front end: responsive web application, suitable for desktop and mobile
- Development environment: Bolt
- Source control: GitHub
- Hosting: Vercel
- Authentication: Supabase Auth
- Database: Supabase Postgres
- File storage: Supabase Storage
- Learning-resource library: `dlbeadle78/kellynwjec`

## Design principles

1. Mobile-first and responsive.
2. Accessible, calm and uncluttered.
3. Persistent user data must live in the backend, not hard-coded in pages.
4. Personal data must not be committed to GitHub.
5. Secrets must be stored in deployment/environment settings.
6. Core organisation and study-support features must work without depending on a paid AI service.
7. AI support, where added, must support understanding, planning, questioning and review rather than complete assessed work.
8. The application must remain portable between hosting/development providers.

## Data separation

The repository contains application code and safe configuration templates only.

Private user information, timetable data, travel data, tasks, uploaded documents, progress and other personal records must be stored in the authenticated backend.

## Deployment flow

1. Development changes are made through Bolt or another approved development environment.
2. Changes are committed to GitHub.
3. Vercel deploys the production branch.
4. Supabase provides authenticated application data and file storage.
