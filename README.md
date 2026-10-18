# Programme Delivery for Claude Code

Keep benefit delivery, session capacity and funder reporting in a database your charity owns. Free under the MIT licence. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Run the demo and import your reports. | Your programmes, units, reporting rules and paperwork. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Start here](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-nonprofit-cloud&utm_medium=readme) | [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=salesforce-nonprofit-cloud&utm_medium=readme) |

## What this replaces

The programme delivery desk: define benefits, plan capacity, record delivered units, reconcile sessions and prepare reporting evidence. Fundraising, grant awards, individual case plans, payments, eligibility decisions and clinical work stay outside this base. It does not reproduce all of Salesforce Nonprofit Cloud.

Salesforce lists Core at US$70 per paid user/month, billed annually. A scenario with 25 paid seats is US$21,000 a year before implementation. Eligible nonprofits receive ten free Core licences and can receive discounts. This is list-price arithmetic, not a customer invoice or a promised saving. [Vendor pricing](https://www.salesforce.com/nonprofit/pricing/), checked 18 October 2026.

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/programme-delivery-for-claude-code.git
cd programme-delivery-for-claude-code
npm install
npm test
npm run demo
```

Node 20.11 or later. The demo creates fictional records and paperwork in temporary storage, then removes them. For a persistent fictional portfolio, run npm run migrate and npm run seed. For real records, run migrate without seed, then import. Do not mix fictional participants with real records.

PGlite runs locally without a database server. DATABASE_URL selects shared Postgres. Use one organisation per private database and trusted operator connections. RLS denies access to ordinary roles by default, but this base has no per-worker permissions system. The owner connection can read all records. Review roles, encryption, backups and access before loading personal information. Keep exported files and paperwork private.

## The weekly job

Review programme ownership and reporting dates. Compare each benefit target against delivered units and future capacity. Reconcile last week's sessions against signed registers. Chase missing evidence and prepare the funder report. Every task has a command and a recorded outcome.

The database rejects deliveries linked to another programme, future deliveries, dates outside the enrolment and units above session capacity. Incorrect deliveries are voided with a reason and kept in history. The evidence pack reports outputs, not unmeasured social outcomes.

## Commands

| Command | Job |
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

Every read supports --json. Names match without case sensitivity. Ambiguous names list candidates and exit with an error. [CLI formats](docs/cli.md).

## Ten questions answered from your records

The insights command answers these today. They are joined questions beyond a single register. Salesforce can also be configured with custom reports, so this is not a claim of vendor incapability.

1. Which benefits have a delivery target that future sessions cannot cover?
2. Which past sessions still need reconciliation?
3. Which programmes have overdue reports and unreconciled sessions?
4. Which active participants have no recorded benefit in thirty days?
5. Which delivery records need their ACNC retention date reviewed?
6. Which people received benefits after their last accuracy check became stale?
7. Which past sessions have no recorded deliveries?
8. How many distinct participants received each benefit, without adding unlike units?
9. Which closed enrolments still have delivery evidence to retain?
10. Which staff own both an overdue programme review and an overdue report?

## Your first hour: ten things to ask for

1. Show the programmes with overdue reports.
2. Which benefit targets have insufficient future capacity?
3. Which past sessions still need their attendance reconciled?
4. Show people with an active enrolment and no recent recorded benefit.
5. Find delivery evidence with a short retention date.
6. Draft our Monday review using only recorded facts.
7. Put our charity name and logo on the funder evidence pack.
8. Import our reports as a test run and show ignored columns.
9. Add a delivery location and show it in the session register.
10. Change the accuracy reminder to our approved review policy.

## Paperwork and views

npm run docs produces programme evidence packs, session reconciliation registers and retention review documents. npm run view produces the week, capacity and attention pages. Change brand.json once for your name, logo and colours. Output is private read-only HTML, printable to PDF. There is no server or editing screen. Draft commands save fact packs for an operator to turn into prose.

## Bring your history

Export Salesforce Details Only CSV reports, include source IDs and relationship IDs, then map your report labels with the supplied mapping example. One command imports all supported files in dependency order with dry runs, conflict detection and atomic rollback. Repeat imports leave unchanged rows alone. [Switch guide](docs/replace-salesforce-nonprofit-cloud.md).

## Checks and limits

The compliance command flags ACNC delivery-record retention dates, stale accuracy reviews and due personal-record retention reviews. It cites [the rules and their limits](docs/compliance.md). A clean result is not a compliance certificate. Attachments remain in your evidence store and are referenced, not copied. Automated attendance collection, portals and integrations are custom work.

npm test uses an isolated database and exercises imports, workflow constraints, rollback, private access, audit history, every CLI route, ten questions, drafts and rendered documents. CI is configured for Linux and Windows on Node 20 and 22. A configured workflow is not evidence of a completed CI run.

## Licence

MIT. Copyright 2026 Enterprise DNA. Salesforce is a trademark of Salesforce, Inc. This independent project is not affiliated with or endorsed by Salesforce.
