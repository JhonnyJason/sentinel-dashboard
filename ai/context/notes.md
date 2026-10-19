# Operational Notes

## Working rules
- The phase follows from `plan/current-task.md`: empty → plan the next task, sub-tasks → implement them.
- Keep context roughly in sync with the code, detailed only for the part in focus.
- Module details belong in the module's `README.md`, not here.
- Unit tests: `node testing/unittests/test.mjs [module...]` - see `testing/unittests/README.md`.
- New module directory → `npm run sync-allmodules` (or create it via `npm run add-module`), else its styles are missing and `initialize` never runs.
- `log` / `olog` output is switched per module in `debugmodule/debugmodule.coffee` (`modulesToDebug`): the user keeps every module listed and comments / uncomments them. Enable the module there when adding debug output, comment it out again when done.
- implicit-dom-connect only creates the global for an id that the code uses as `idName.` (property access). An id only passed as an argument (`fn(idName)`) stays undefined → add a `# idName.` comment line as workaround (the user's convention).

## Seasonality (current focus)

### Flow
```
seasonalityframemodule (state: selectedSymbol, selectedRangeY, chartTimeframe, selectedCycle, backtestingRegion)
  ├─ SymbolSelect → onStockSelected → loadDataAndRenderChart
  ├─ history select (#history-timeframe-select)   → timeframeSelected
  ├─ chart timeframe select (yearly | quarterly | monthly | weekly) → chartTimeframeChanged
  ├─ seasonalitycyclesmodule: setRange(Jan 1 of selectedRangeY years ago, today); change listener → selectedCycle
  ├─ marketdatamodule.getCloseChunks → frame: isIncluded, ages, calculateSeasonalityComposite
  ├─ seasonalitychartmodule.prepareData({ composite, chunks, refDate, timeframe, ages }) / render  (range select → backtestingRegion)
  ├─ seasonalityblocksmodule.setData(chartData) - block bar chart from the same data
  └─ seasonalitybacktestingmodule.run (entry/exit dates from the chart axis, one run per period back, isRunIncluded in single mode)
```
- `selectedCycle` filters composite + backtest. Display modes (continuous / single) in `seasonalitychartmodule/README.md`.
- The selection is index-based: reset when the layout (`timeframe` + `ages`) changes.
- Timeframe change → cycles module resets to "Kein Zyklus"; presets are filtered by unit, so a cycle never switches the timeframe.
- The frame calls the cycles module during its `initialize`; this relies on allmodules order (cycles before frame).

### datacache shape
- Fetches 31 years once per symbol, keeps raw data + meta.
- `keyToHistory` (years: 365/366 slots), `keyToHistoryQuarters` (93 slots), `keyToHistoryMonths` (31 slots),
  `keyToHistoryWeeks` (7 slots, Mon=0) - newest first, missing slots `null`.
- `getHistoricCloseChunks(key, timeframe, toAge)` leaves missing days as holes, full-length arrays.
- Preparation happens in `marketdatamodule` (yearly via `normalizeYearData`), so the seasonality core is timeframe-agnostic. Composite curves have N + 1 points.

## Styling conventions
- `#chart-container` is 760px: `#seasonality-chart` the top 500px, `#seasonality-blocks` the lower 260px. Overlays positioned against the seasonality chart use `top` (e.g. `#reset-time-axis-button`).
- Regular text buttons: `button.click-button.standard-button` (`globalstyles/styles.styl`). Only layout (width, margin) goes into the module's styles.
- Selects: `.select-wrapper: select#…` (arrow + field style in `globalstyles/styles.styl`). Modules only add widths.
- `reset.styl` strips defaults: `b` has `font: inherit` (set `font-weight bold` explicitly), `ul` has `list-style: none`.
- CoffeeScript trap: a postfix `for` binds to the `else` branch - `((if a then b else c) for x in xs)` needs the inner parentheses.
