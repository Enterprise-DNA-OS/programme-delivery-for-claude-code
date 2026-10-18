# Change fields, units or review rules

Read CLAUDE.md and the relevant existing command. Confirm the requested field, unit or rule in plain language. Back up the database with export. Write a new numbered migration under supabase/migrations, update scripts/lib/entities.json and the relevant queries and paperwork. Preserve history. Run npm test, apply npm run migrate to the intended database, and show a read proving the change. Never rewrite an applied migration or expose private records.
