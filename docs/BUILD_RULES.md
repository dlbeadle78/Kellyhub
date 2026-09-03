# Kellyn Hub Build Rules

These rules apply to the full build and later development.

## Product direction

Kellyn Hub is a genuine personal learning and organisation application. It is not a generic student dashboard, demonstration site or AI homework-writing tool.

## User experience

- Prioritise clear next actions.
- Keep screens calm and easy to scan.
- Use consistent navigation and component patterns.
- Support desktop Chrome and mobile layouts.
- Build Focus Mode, Read Aloud and text-size controls as genuine usable features where specified.
- Use the approved visual mock-ups as design references, while implementing working application behaviour behind them.

## Application behaviour

- Tasks, progress, preferences and other user records must persist between sessions.
- Do not hard-code private personal data into source files.
- Use reusable data models and components rather than duplicate subject-specific systems.
- Keep the subject, task, planner, progress and UCAS areas connected to the same underlying data where appropriate.
- Build features so they can be tested independently.

## AI boundaries

AI may support:

- explanation;
- simplification;
- planning;
- breaking tasks into manageable steps;
- questioning and quizzing;
- reflection;
- review of work the learner has already produced.

AI must not:

- complete assessed schoolwork;
- write coursework for submission;
- fabricate evidence;
- produce a personal statement for direct submission;
- replace the learner's own academic work.

Core functionality should continue to work if an AI integration is unavailable or its usage allowance is exhausted.

## Security

- Never commit live credentials, service-role keys, passwords or tokens.
- Use environment variables for deployment secrets.
- Keep private user records in the authenticated backend.
- Apply appropriate row-level access controls before storing real user data.

## Testing

Before a feature is treated as complete:

1. Test the full affected user journey.
2. Test desktop layout in Google Chrome on Windows.
3. Test mobile/responsive layout.
4. Check keyboard and basic accessibility behaviour.
5. Confirm data persists correctly.
6. Confirm unauthorised users cannot access protected data.
7. Check there are no obvious broken links, dead controls or placeholder actions presented as working features.
