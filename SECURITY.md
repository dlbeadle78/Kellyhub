# Security and Privacy

Kellyn Hub handles personal learning and organisation data. The source repository must not contain private operational data.

## Do not commit

- passwords or login details;
- API keys, tokens or service-role credentials;
- private user records;
- real school timetable entries or travel routines;
- uploaded schoolwork or teacher feedback containing personal information;
- private UCAS information;
- database exports;
- environment files containing live credentials.

## Required approach

- Store secrets in Bolt/Vercel/Supabase environment settings as appropriate.
- Store private application data in Supabase behind authenticated access controls.
- Use `.env.example` only for variable names and blank placeholders.
- Review screenshots and design assets before committing them to ensure they do not expose private information.
- Apply and test database row-level security before adding real personal records.

## Repository visibility

If private or personally identifying material is ever required in the repository, change the repository to private before adding it. Prefer keeping private data out of source control entirely.
