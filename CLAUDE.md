# Programme Delivery for Claude Code

Read this before acting. This is the private operations desk for a charity running non-cash community services. It records what was delivered, in which unit, to whom, and which evidence supports the report.

## Rules

- Every answer starts with the database. Use scripts/programmes.mjs and the one library in .claude/commands.
- Drafts never send. Never email, publish a participant record or submit a funder report.
- Read before changing records. A name with several matches must be resolved by the operator.
- Only record verified deliveries. Do not infer attendance, eligibility, consent, needs or outcomes.
- Do not combine different units. Parcels, visits and hours are separate measures.
- An actor label is an audit note, not authentication. Use one organisation per private database with trusted operator access.
- Retention reviews do not authorise disposal. Keep applicable legal holds and evidence. No deletion command is provided.
- Changes use a new migration, meaningful tests and a reviewed import. Run npm test before committing. Stay on main.
- Tailor brand.json to the organisation. All personal records and generated paperwork stay private.

## Commands

| Job | Purpose |
|---|---|
| /programme-review | Review programme owners, enrolments and overdue reports |
| /benefit-capacity | Compare targets, delivered units and future session capacity |
| /session-roster | Reconcile sessions with recorded attendance and units |
| /delivery-ledger | Read benefit deliveries and evidence |
| /reporting-due | Review funder reporting deadlines |
| /participants | Read participant ownership and review dates |
| /enrolments | Review programme participation |
| /attention | Find overdue reviews, sessions and reporting |
| /compliance | Check retention and accuracy review records |
| /notes | Read programme notes |
| /history | Review recent changes |
| /weekly-review | Write the Monday delivery review |
| /insights | Answer ten questions across the programme records |
| /programme | Read one programme with its delivery history |
| /participant | Read one participant and enrolment history |
| /add | Add a verified record from a JSON file |
| /log | Record a programme note |
| /complete-session | Record a completed session reconciliation |
| /record-report | Record a completed reporting milestone |
| /void-delivery | Void an incorrect delivery while retaining its history |
| /close-enrolment | Close an enrolment with an outcome |
| /review-participant | Record a completed accuracy check and its evidence |
| /review-programme | Record a review and schedule the next one |
| /retain-delivery | Extend an evidence retention date |
| /draft-weekly-review | Draft the Monday review from current facts |
| /draft-funder-report | Draft a programme delivery evidence pack |
| /draft-session-reconciliation | Draft a session reconciliation note |
| /import | Import Salesforce Details Only CSV reports |
| /export | Export every record and the audit trail |
| /view | Render read-only review pages |
| /documents | Render branded programme paperwork |
| /customise | Change fields, units or review rules |
| /new-view | Add a read-only review page |

## Locations

scripts/lib/entities.json defines supported fields. supabase/migrations holds the schema. docs/cli.md explains operations, docs/compliance.md explains record checks, and docs/replace-salesforce-nonprofit-cloud.md explains the import. AGENTS.md routes every agent to this file.

Installed and operated through Omni by Enterprise DNA: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-nonprofit-cloud&utm_medium=readme
