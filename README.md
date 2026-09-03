# Kellyn Hub

Kellyn Hub is a personal learning and organisation web application intended to support independent study, planning, revision, UCAS preparation, university preparation and day-to-day organisation.

## Planned architecture

- **Development:** Bolt
- **Source control:** GitHub
- **Hosting:** Vercel
- **Authentication, database and file storage:** Supabase
- **WJEC resource library:** `dlbeadle78/kellynwjec`

## Repository purpose

This repository is the permanent source-code home for Kellyn Hub. The application should remain portable so that the development or hosting provider can be changed later without rebuilding the project from scratch.

## Current status

Repository initialised. The full application build will be completed from the approved Kellyn Hub build specification and visual references.

## Important security rule

Do not commit passwords, API keys, private tokens, personal records, school timetable data, travel routines or other private user information to this repository. Runtime configuration must use environment variables and personal application data must be stored in the approved backend/database.

## Related repository

Official learning-resource material used by the Hub is maintained separately in:

- `dlbeadle78/kellynwjec`
