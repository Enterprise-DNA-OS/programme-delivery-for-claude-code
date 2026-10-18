# Record checks and sources

Checked 18 October 2026. These checks support an operator's review. They are not legal advice, a compliance certification or authority to delete anything.

## ACNC-7Y

ACNC-registered Australian charities must retain operational and financial records for seven years. The delivery check applies only where the programme has jurisdiction AU and acnc_registered true. It flags a delivery retain_until earlier than delivered_on plus seven years, including void records. It is a narrow date check on one kind of operational record. It cannot prove that an external attachment exists, a backup can be restored or all records have been retained. Longer contract or legal requirements must be applied separately. Use retain-delivery to extend the date with evidence.

[ACNC: Keeping charity records](https://www.acnc.gov.au/for-charities/manage-your-charity/obligations-acnc/keeping-charity-records).

## PRIVACY-ACCURACY

New Zealand privacy principle 8 requires reasonable steps to ensure personal information is accurate before use or disclosure. The active-participant check flags missing accuracy checks or checks older than 90 days. Ninety days is an internal reminder, not a statutory period. Australian organisations can use the same reminder under their own policy, but the command does not determine which privacy law applies. Record a completed check and its evidence with review-participant.

[New Zealand Privacy Commissioner: Principle 8](https://www.privacy.org.nz/privacy-principles/8/).

## PRIVACY-RETENTION

New Zealand privacy principle 9 limits retention to what is required for lawful purposes. The command flags a participant whose organisation-set retention_review_on has arrived. It requires a human to reconcile continued need, linked operational records, funder contracts and legal holds. It never deletes or anonymises records. Keeping minimal participant identifiers in operational evidence is a policy decision requiring review.

[New Zealand Privacy Commissioner: Principle 9](https://www.privacy.org.nz/privacy-principles/9/).

## Integrity and responsibility

The database enforces linked programmes, delivery dates, positive units and session capacity. It keeps before and after values with the recorded operator label. Those controls do not verify attendance or consent. Programme staff retain responsibility for service delivery and safety. The base does not process payments, assess eligibility or manage clinical care. Financial accounts and charity regulator submissions remain outside it.
