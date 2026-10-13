# Task
Implement filtering of the Seasonality Composite to only include the selected datachunks as set by the cycle editor.

## Details
- `cycles.getCycle()` → `{ unit, size, anchor, included }` or `null` ("Kein Zyklus" = all chunks). The cycle unit always equals the chart timeframe unit.
- Chunks are newest first, chunk `k` = `k` periods before the period of the newest data date (`refDate`), not of today. Map via absolute period indices: `positionOf(periodIdxOfDate(unit, refDate) - k, anchorIdx, size)`.
- **Filter after `toLogFactorArrays`**, not on the raw chunks: returns chain across chunk boundaries (first return of a chunk is against the last close of the previous chunk). Dropping chunks first would compare e.g. a midterm year's Jan 2 against the close of the midterm year 4 years earlier.
- No included chunk in the range → show the no-data / error message, not a flat 0 line.
- No "x von y Jahren" indicator: the cycle table header and the backtest details / summary already show what was used.

## Guidelines: display modes
Two modes, decided only by the cycle:

| | **continuous** | **single** |
|---|---|---|
| when | no cycle, or all positions included | some positions excluded |
| displayed chunk ages | `[1, 0]` (last + current period, as today) | `[d]`, d = newest included age (may be 0) |
| composite | front ends at 100, back continues | one period, starts at 100 |
| latest data | chunks 1 + 0 | chunk d - e.g. every 2nd year in a year between → last year's complete chunk |
| selection | may cross the period border | within the one period, no crossing possible |
| backtest | all runs (filter is all-true anyway) | only runs with included age |

- **One rule, both modes:** the layout is a list of chunk ages `ages`. The 100 point is the start of the last part: earlier parts are built backward ending at 100, the last part forward from 100. Latest data is normalized to the last close before the last part = last number of `chunks[lastAge + 1]` (fallback: first number of `chunks[lastAge]`). In continuous mode this is exactly today's behaviour.
- **`isIncluded` null ⇔ continuous.** The frame sets `isIncluded = null` for no cycle *and* for a full cycle. Every consumer only checks `isIncluded?`.
- The Jan + Feb case (consecutive positions, a crossing would make sense) stays single for now.
- The entry / exit question is gone: crossing only happens in continuous mode, where every run is included.
- Quarterly (deferred) then only needs its own `periodPart` and chunk data, no extra mode logic.

## Guidelines: refactorings
- **Slot space everywhere.** Every chunk leaves marketdata in the slot space of its timeframe: yearly 366 (normalized, FEB29 slot), quarterly 93 (`monthInQuarter * 31 + day - 1`), monthly 31, weekly 7. Composite and latest data are both placed on the axis via the same `part.slots` - no more raw 365-day years in the chart.
- **A composite = chunks + filter.** marketdata only delivers the chunks:
  `getCloseChunks(symbol, timeframe, years)` → `{ chunks, refDate }` (newest first, window back to Jan 1 of newest year - years, the window logic lives here once).
  The frame computes `calculateSeasonalityComposite(chunks, 0, isIncluded)` and takes the latest data from the same chunks.
  This replaces `getSeasonalityComposite*` + `getLatestData*` (+ datacache `getLatestCloseData*`). Forex screener: `getCloseChunks(sym, "yearly", 10|15)` + composite.
- **chart: pure layout file** `seasonalitychartmodule/chartlayout.coffee` (no DOM → unit-testable), split into axis and series:
  - `buildAxis(timeframe, refDate, ages)` → `{ parts, xAxisData, backStartIdx }`, one `periodPart(timeframe, refDate, age)` → `{ slots, start }` replaces `prepareChartData*`.
  - `placeComposite(axis, composite)` and `placeLatest(axis, chunks)` → series arrays on that axis.
  - `backStartIdx` = start index of the last part (0 in single mode → the visible range is the whole axis, `chartfun` needs no change).
- **Selection is index-based**, so it is only valid for the axis it was made on. Reset `backtestingRegion` + chart selection when the layout changes (timeframe or cycle change). A history range change keeps the layout → keep the selection. (Today a timeframe change keeps the indices of the old axis - a latent bug this fixes.)
- **Quarterly** is a timeframe like the others: a datacache bucket (93 slots, same loop as months / weeks), a `periodPart`, `shiftPeriodsBack(…, "quarterly")`, unit `quarters` (already supported by `cyclemath`).
- **Prepared for multiple composites** (deferred): every composite is `chunks + { method, isIncluded }` on the same chunks and axis, so more composites are more filters + more `placeComposite` calls - no further restructuring.

## Sub-Tasks
- [x] 1. `cyclemath`: `includedChunkFn(cycle, refYmd)` → `(k) -> boolean` + unit test.
- [x] 2. `seasonality` + `marketdatamodule`: optional chunk filter on `calculateSeasonalityComposite` (applied after `toLogFactorArrays`), passed through the three `getSeasonalityComposite*`. No filter → unchanged + unit test.
- [x] 3. `seasonalityframemodule`: `onCycleChanged` reloads the chart; `retrieveRelevantData` builds the filter from `selectedCycle` + `refDate`.
- [x] 4. Empty case: no included chunk → no-data / error message instead of a flat line.
- [x] 5. `marketdatamodule`: `getCloseChunks` (slot space) replaces the 3 composite + 3 latest functions (+ datacache `getLatestCloseData*`); frame computes the composite; forex screener switched.
- [x] 6. `cyclemath`: `displayAges(cycle, isIncluded)` → `[1, 0]` (continuous) or `[d]` + `isFullCycle`; frame passes `isIncluded = null` for a full cycle + unit test.
- [x] 7. `chartlayout.coffee`: `buildAxis` / `placeComposite` / `placeLatest` over `ages`, `seasonalitychartmodule` uses it + unit test (continuous = unchanged output, single for years / months / weeks, latest normalization incl. fallback).
- [x] 8. Frame: `chartData = { axis inputs, composite, chunks, refDate, timeframe, ages }`; reset the selection on timeframe / cycle change.
- [x] 9. Backtest: `run(..., isRunIncluded)`, frame passes `(k) -> isIncluded(ages[0] + k)` in single mode, null otherwise; skipped runs are left out of the summary + details.
- [x] 10. Screener jump (`setSeasonalityBacktestingState`): always reset to "Kein Zyklus" - today `setUnit("years")` returns early if the unit already is years, so an active yearly cycle filters the screener's backtest. Needs a small `cycles` export to select "Kein Zyklus".
- [x] 11. Quarterly data: datacache quarter bucket (93 slots), `getCloseChunks(…, "quarterly")`, `utl.shiftPeriodsBack` quarterly + unit tests.
- [x] 12. Quarterly UI: chart timeframe option `Quartalsweise`, `periodPart` quarterly, `timeframeToUnit`, backtest label (`formatLabel`), cycles: `"quarters"` in `USABLE_UNITS` + preset `Quartale im Jahr` (4 × quarters, anchor 2026-Q1).
- [x] 13. Docs: cycles README ("not used by the analysis yet", quarters), chart README (layout / modes / slot space), marketdata README, `ai/context/notes.md`, tick off the items in `deferred.md`.
