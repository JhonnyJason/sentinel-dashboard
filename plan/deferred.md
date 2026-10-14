# Collection of Deferred Information
Anything that cannot be considered during the current process will be deferred and remembered here. 

## Deferred Items

### General noted updates (TODO later)
- [ ] seasonalityframe: adding light-blue background below line "mountain-diagram" style
- [ ] Decide: include the unfinished chunk 0 in the composite? With the ADR core this is
      just dropping `.slice(1)` in `calculateSeasonalityComposite` (its missing days give
      no samples). Trade-off: the latest series then partly compares against itself.
- [ ] Years select is clamped to the symbol's depth only *after* loading: switching from a
      deep symbol (e.g. 30 years selected) to a shallow one (e.g. 12 years of data) loads
      the chart with 30, which uses all ~12 years; `updateYearsOptions` then shows 10.
      Chart (12y) and label / later backtest (10y) disagree until the next select.
      Fix idea: in `loadDataAndRenderChart`, reload once if `updateYearsOptions` changed
      `selectedRangeY` (data is cached by then, so cheap).
- [ ] `datacache.coffee`: concurrent calls of `getHistoryHLC` / `getMonthlyHistoryHLC` /
      `getWeeklyHistoryHLC` for a not yet loaded key trigger multiple
      `retrieveFullHistory` requests → cache the in-flight promise per `dataKey`.
- [ ] `datacache.coffee`: if `digestRemoteData` returns early (no data), the history maps
      stay unset and `extractRelevantHistory` crashes on `undefined`.
- [ ] `datacache.coffee`: `repairHLC` is commented out in `digestRemoteData` – verify
      this is intended (affects all consumers).
- [ ] `datacache.coffee`: per-month `log` in `digestRemoteData` prints ~370 lines per
      loaded symbol.
- [ ] `datacache.coffee`: dates are created as UTC noon but read with local getters –
      fine for UTC-11 … UTC+11, wrong beyond.
- [ ] partnersframemodule - define and communicate exact Sentinel pricing conditions per Partner.

### Equity performance: follow-ups
- [ ] Second buy-in: define the trigger (e.g. drop of X%), the size, and how the stop-loss relates to it.
- [ ] Green max-rise markers on the trades bar chart (optional toggle).
- [ ] Configurable starting equity (fixed at 100$ for now).
- [ ] Use `tradesimulationmodule` + the UI in the event screener (and other sources of repeatable trades).
- [ ] Open prices: we only have HLC, so a day that opens below the stop-loss and then rallies above it
      is filled at the stop-loss level (optimistic). Exact fills need real open values → backend + datacache changes.

### implicit-dom-connect: id detection bugs (tooling, not this repo's sources)
An id only gets its global when the code uses its camelCased name in a recognised form (e.g. `idName.`). Known misses:
- [ ] An id used only as an argument (`setSignedPercent(equitySumProfit, ...)`) is not detected.
      Workaround: a `# equitySumProfit.` comment line next to the call.
- [ ] Ids in certain Pug nesting constructs are not picked up at all → the global has to be added by hand.
Fix idea: treat any word-boundary match of the camelCased id as a use, not only property access.

### Standardise input fields
Inputs are styled per module (symbolselect, cycles, equity performance), each repeating border, radius, padding and focus glow.
Thoughts:
- Root cause first: `reset.styl` clears border, padding and background on `input:focus` / `select:focus`, so every module
  has to restyle the focus state. Dropping those properties from the reset makes the normal state survive focus.
- One global rule in `globalstyles` (like `.standard-button`), driven by colour variables:
  `input, select { color var(--input-fg); border 1px solid var(--input-fg); background var(--input-bg); border-radius 3px }`,
  `:focus { box-shadow 0 0 5px var(--input-fg) }`. Defaults: dark-blue on white.
- Dark surfaces (e.g. `#backtesting-details-container`) only set `--input-fg: #fff; --input-bg: transparent` - inputs inside
  are styled correctly without any module rule. Modules keep layout (width, margin) only.
- The `.select-wrapper` arrow (copied in seasonalityframe and trafficlightframe) belongs in the same place.

### Datacache: Refresh/Invalidation Mechanism
Add ability to force re-fetch stale data (e.g. `refreshHistory(dataKey)` or automatic staleness check). Context: 5-day freshness tolerance noted in design.

### Seasonality: Reinstate Fourier method
`fourierRegression` (+ `lowPass`, `highPass`, `filterHarmonics`) in `seasonality.coffee` is commented out (current task, section 5); `method == 1` only logs an error.
To bring it back it must handle the new prepared data: `null` slots (FEB29 in non-leap years, day 29–31 in monthly) and `undefined` missing days, and work for monthly / weekly chunk lengths (not just 366).

### Seasonality cycles: follow-ups
- [x] Use the defined cycle in the analysis (composite / backtest): only periods at the positions checked
      in the table header (`getCycle().included`), e.g. all midterm years, or all months except Dec - Feb.
- [ ] Table orientation `'columns'` (SPEC §5).
- [ ] Option to expand the compact cycles table to all cycles.
- [ ] Cell interaction on `data-period` cells.
- [ ] Preset `Dekadenzyklus` (10 × years, anchor 2020) - once historic data reaches deeper than 10-20 years.

### Seasonality: multiple composites
Instead of the rigid ADR + "Neuester Verlauf" toggles, the user defines several composites and toggles each one in the legend, e.g.:
- years 0 → -5, 0 → -10 and -5 → -10 side by side
- all years vs. midterm years vs. election years
- ADR vs. Fourier (once reinstated)

Rules:
- All composites of one chart share the chart timeframe (one axis).
- Exactly one composite is the backtest target, and the UI makes clear which one. Its mode decides the selection: continuous → may cross the period border, single → within one period.
- On a continuous axis a filtered (single) composite is drawn on the last part only.

Prepared by the cycles task: a composite is `chunks + { method, isIncluded }` on shared chunks (a history range like -5 → -10 is just an age filter, combined with the cycle filter), placed via `placeComposite(axis, composite)`, backtest via `isRunIncluded`. Missing then: the composite definitions (UI + state), loading the deepest window needed, a legend per composite and the target choice.
