# Replace the programme delivery desk in Salesforce Nonprofit Cloud

## Export once, import as a test run, then reconcile

Salesforce supports Details Only CSV report exports with the Export Reports permission. Open Reports, run the report, choose Export, Details Only and CSV with UTF-8 encoding. Include record IDs and relationship IDs. Do not use a formatted report, group totals or a Salesforce backup ZIP.

[Salesforce report export instructions](https://help.salesforce.com/s/articleView?id=sf.reports_export.htm&language=en_US), checked 18 October 2026.

Export reports for Program, Benefit, participants, Program Enrollment, Benefit Session and Benefit Disbursement. Reporting milestones and programme notes come from your relevant custom reports. Report names and labels vary by organisation. The files under examples/salesforce are illustrative report exports with chosen labels, not a claim of universal Salesforce headings.

| File | Records | Relationship |
|---|---|---|
| programmes.csv | Program | Local jurisdiction, owner and review policy must be mapped |
| benefits.csv | Benefit | programme_id references a programme source ID |
| participants.csv | Account or Contact report used for participants | Local accuracy and retention dates must be provided |
| enrolments.csv | Program Enrollment | programme_id and participant_id |
| sessions.csv | Benefit Session | benefit_id |
| deliveries.csv | Benefit Disbursement | enrolment_id and session_id |
| milestones.csv | Your reporting-deadline report | programme_id |
| notes.csv | Your programme-note report | programme_id |

The free version supports non-cash benefit delivery against sessions. Anonymous disbursements, walk-ins without an enrolment and non-session deliveries need explicit mapping and model changes before import. It does not silently discard them.

Rename files to the supported names. Copy mapping.json and map each of your report labels to the documented target fields. Convert dates to YYYY-MM-DD and status values to the accepted enums. Supply the local retention policy, target units and session capacity. These controls are not inferred from Salesforce. Include every required field shown in scripts/lib/entities.json. Preserve source IDs as text.

```bash
npm run migrate
npm run programmes -- import salesforce path/to/exports --mapping=path/to/mapping.json --dry-run
npm run programmes -- import salesforce path/to/exports --mapping=path/to/mapping.json
```

The importer reads existing supported files in dependency order. It reports ignored columns, rejects missing links and duplicate source IDs, and rolls the entire batch back on a failed row. Review ignored columns before the real import. Unchanged repeated imports do nothing. Changed values stop for reconciliation rather than overwriting history. Numeric values such as 2 and 2.00 compare equally.

Before switching, reconcile record counts, samples of participant history, units by benefit and reporting dates against Salesforce. A test run can be done in a day when reports and mapping are ready. Data cleanup, historical gaps and unsupported records require their own work.

Attachments, signed registers, security permissions, automation, portals, fund accounting, fundraising, eligibility decisions and case notes do not carry over through this importer. Keep evidence in its controlled document store and record its reference. Retain source exports securely and confirm your backup restore. Change the working system only after reconciliation and operator acceptance.
