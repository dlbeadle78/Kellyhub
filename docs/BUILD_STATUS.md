# Build Status

## Completed foundation

- React/Vite application shell
- Supabase authentication
- Persistent profile settings
- Row Level Security schema
- Private file bucket and file metadata
- Subject records and WJEC resource links
- Tasks, safe task steps and statuses
- Planner events
- Timetable entry management
- Travel-step management
- Practice records
- UCAS evidence bank
- University research tracker
- Independent living skills tracker
- Quick Capture
- Accessibility controls
- PWA shell and responsive navigation

## Data rule

Private timetable, travel, school work and personal records are intentionally not hard-coded in GitHub. They must be entered through the authenticated app and are then stored in Supabase.

## Next verification

After deployment:

1. Create the intended user account.
2. Confirm email if Supabase requires it.
3. Sign in.
4. Add one task and confirm it persists after refresh.
5. Upload a small test file and confirm the storage policy accepts it.
6. Add a timetable entry and a travel step.
7. Test desktop Chrome and a mobile browser.
8. Check keyboard navigation and Read Aloud.
9. Confirm unauthenticated visitors see only the sign-in screen.
