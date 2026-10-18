# Operator CLI

Run npm run programmes -- <command>. Every read supports --json. Dates use YYYY-MM-DD. Arguments with spaces need shell quotes. Entity and field names are allowlisted in scripts/lib/entities.json.

## Read

programme-review, benefit-capacity, session-roster, delivery-ledger, reporting-due, participants, enrolments, attention, compliance, notes, history, weekly-review and insights take no positional arguments. programme <name-or-id> and participant <name-or-id> return the linked history. Exact source IDs and UUIDs win, then UUID prefixes and case-insensitive names. Ambiguity lists matches and exits 1.

## Record a delivery

Write a JSON file with source_id, name, enrolment_id, session_id, delivered_on, units, evidence and retain_until. References accept source IDs or unambiguous names. Units are positive with at most two decimals. The session fixes the benefit and programme. Then run:

```bash
npm run programmes -- add deliveries --file=delivery.json --actor=Alex
```

add <entity> --file=<file> works for all eight record types. Required fields and dates are in scripts/lib/entities.json. Use add for programme setup, benefits, participants, enrolments, sessions, milestones and notes. Historical deliveries can be imported for closed enrolments if their dates are within the enrolment period. Imports do not decide whether a person was eligible.

## Record an action

```bash
npm run programmes -- log pro1 --text="Checked the signed register" --actor=Alex
npm run programmes -- complete-session ses41 --evidence="Signed register reconciled" --actor=Alex
npm run programmes -- record-report mil61 --evidence="Internal evidence pack filed" --actor=Alex
npm run programmes -- void-delivery del51 --evidence="Duplicate record" --actor=Alex
npm run programmes -- close-enrolment enr32 --evidence="Participant completed programme" --actor=Alex
npm run programmes -- review-participant par21 --evidence="Details checked with participant" --actor=Alex
npm run programmes -- review-programme pro1 --next=2027-01-01 --evidence="Board review" --actor=Alex
npm run programmes -- retain-delivery del53 --until=2035-01-01 --evidence="Retention policy confirmed" --actor=Alex
```

These identifiers belong to the fictional demo. A reporting milestone records a fact, never submits a report. Retention dates can only be extended through the CLI. A void delivery still exists and remains in the audit history. Use a new source ID for a corrected replacement. Actor labels record operator assertions and do not authenticate a person.

## Draft, import and export

Drafts: draft-weekly-review, draft-funder-report <programme>, draft-session-reconciliation <session>. The output is a private JSON fact pack, not an email. Export writes a complete JSON snapshot including IDs and audit history. It is an archive format, not a CSV restore command. Test your database backup restore separately.

```bash
npm run programmes -- import salesforce examples/salesforce --mapping=examples/salesforce/mapping.json --dry-run
npm run programmes -- export --json
```

OUTPUT_DIR changes the destination for exports, drafts and HTML. DATA_DIR changes local storage. DATABASE_URL selects Postgres. Tests and demo override database settings to isolate fictional data. Never put generated records into Git.
