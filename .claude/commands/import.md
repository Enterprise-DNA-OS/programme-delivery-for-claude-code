# Import Salesforce Details Only CSV reports

Read CLAUDE.md and docs/cli.md. Run:

```bash
npm run programmes -- import salesforce <folder> --mapping=<mapping.json> --dry-run
```

Read docs/replace-salesforce-nonprofit-cloud.md. Inspect the dry-run totals and ignored columns. Resolve every missing link or conflict. Run the same command without --dry-run only for the intended import, then reconcile counts and samples. Nothing writes to Salesforce.
