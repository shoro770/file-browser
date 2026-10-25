# Verification before commit

Epic 1 retro: the gates that actually passed at every story were `npm run build`, `npm run lint` and `npm test`. `lint` includes the read-only grep gate (`scripts/check-readonly.mjs`).

- Run all three — `npm run build`, `npm run lint`, `npm test` — before committing. `npm run build` is the type check; `npx tsc --noEmit` checks nothing (see AGENTS.md pitfalls).
- Do not edit, weaken or bypass `scripts/check-readonly.mjs` to make a change pass.
- Features that need a real folder picker, performance targets (about 1,000 entries open under 300 ms, expand under 100 ms) or visual states cannot be proven headlessly. Run the spec's manual check in Chrome or Edge, or report it as not run.
