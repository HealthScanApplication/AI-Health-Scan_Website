# Guardian click audit — 16 October 2026

## Browser coverage

Authenticated browser checks against production, followed by local retests of repaired flows:

| Page | Checks |
| --- | --- |
| Overview | Sidebar entry, tool cards, metrics rendering |
| Library | Page loading, Save URL and transcript form toggles, required-field disabled states |
| Leads | Add form opening, required name, switching away without saving |
| Offers | Builder/path tabs, existing offer cards and path listing |
| Protocols | List/card loading, existing private QA Protocol editor, details, schedule and preview controls |
| Recipes | Filter expansion, existing recipe editor, App preview toggle |
| Diet | Recipe picker/results, meal selection, nutrition update, conflict review |
| Fitness | Week drafting, sessions/exercises, activity picker opening/search entry |
| Content | Source switching, format/background changes, caption copy confirmation |
| Profile | Form/booking controls render |
| Admin | Site list loads and public-site action renders; moderation not changed |
| Setup steps 1–5 | Step entry, guidance area tab, audience controls, offers/site previews, public-site link |
| Public profile/path | Published page loading, offer links, workspace return |

Local browser retests verified that sidebar navigation survives reload; Add forms close between sections; Back from an open recipe editor restores Leads; offer paths have working links; public workspace return opens setup; setup step 3 survives reload.

## Repaired issues

- Sidebar and setup clicks did not update the URL or follow browser history.
- Browser history could retain editor IDs and leave another tool blank.
- Add forms and unsaved values leaked between unrelated tools.
- Failed quick-create requests had no visible error and closed the form; pending creates were not disabled.
- Existing offer-path URLs were plain text with no open action.
- Public path routes ignored the requested slug and silently used the first published path. Unknown/unpublished paths now show unavailable rather than another funnel.
- Public profile cards sent every path to the same funnel anchor.
- The public “Guardian workspace” link opened the marketing page instead of the workspace.

## Automated coverage and review

Ten real-component/hook interaction tests exercise the above routing/form contracts, including save failure, path choice and unknown paths. External data calls use controlled fixtures; rendering, event handlers and state transitions are real. The tests were observed failing before the corresponding fixes. Independent review found the retained-editor history bug, which was reproduced, fixed and retested before approval.

## Limits

This is a main-flow click audit, not a claim that every possible account/data combination is covered. Publishing, moderation, deleting, emailing customers, AI generation, paid checkout and production profile edits were intentionally not executed. No production records were created or changed during this audit. Database/RLS, payment-provider and AI-service behavior were not re-audited. The build retains existing bundle-size warnings.
