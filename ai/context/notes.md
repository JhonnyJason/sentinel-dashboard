# Operational Notes

## Quick Reference

### Entry Points
- `sources/source/index/index.coffee` - Main entry (just imports allmodules)
- `sources/source/allmodules/allmodules.coffee` - Module aggregation
- `sources/page-heads/index/document-head.pug` - HTML structure

### Configuration
- `sources/source/configmodule/configmodule.coffee`
  - Backend URLs (dev: sentinel-backend.dotv.ee)
  - Currency pairs list
  - UI timing constants

### Key Patterns

**Module Pattern**: Each module exports `initialize()` called at startup.

**UI State Machine** (`uistatemodule`):
```coffee
applyBaseState["summary"] = ->
    dataModule.heartbeat()
    content.setSummaryState()
    ...
```

**DOM Connection**: Uses `implicit-dom-connect` to auto-bind DOM elements from pug templates to CoffeeScript globals.
- Converts kebab-case IDs to camelCase: `#symbol-input` → `symbolInput`
- Elements become available as globals without explicit `document.getElementById`

**Templating**: Mustache templates embedded in pug, rendered at runtime.

**Imports**: All `.coffee` files transpile to same directory (`toolset/build/js/`), so imports use flat paths like `"./scimodule.js"` regardless of source folder structure.

### File Locations for Common Tasks

| Task | Location |
|------|----------|
| Add new currency pair | `configmodule.coffee` -> `shownCurrencyPairLabels` |
| Modify scoring algorithm | `scorehelper.coffee` |
| Add new economic area | `economicareasmodule.coffee` |
| Change chart behavior | `seasonalityframemodule/chartfun.coffee` |
| Modify auth flow | `accountmodule.coffee`, `scimodule.coffee` |
| Add new UI state | `uistatemodule.coffee`, `navtriggers.coffee` |

### Current State (as of review)

**Features Implemented**:
- Login/logout with session management
- Economic area display with live data
- Currency pair trend scoring
- Seasonality charting with real data and UI state management

**Incomplete/TODO areas** (found in code):
- `seasonalityframemodule`: Selection behavior for date ranges
- Service worker: Minimal implementation

### External Dependencies Worth Knowing
- `navhandler` - URL-based state management
- `secret-manager-crypto-utils` - SHA256 hashing
- `thingy-schema-validate` - Runtime type validation
- `uplot` - Lightweight charting
- `fft.js` - Fourier transform for seasonality

## Current Focus: Seasonality Frame Polish

**Goal**: Complete UI state management and interactivity for seasonality chart.

**Completed**:
- [x] Chart visibility state classes (chart-active/chart-inactive)
- [x] Close chart button wiring with full state reset
- [x] Timeframe select reset to default on close
- [x] Cursor indicator showing date (dd.mm.yyyy) on hover
- [x] Chart components as interactive legend (toggle series visibility)
- [x] Years indicator updates on symbol/timeframe selection
- [x] Fourier regression on-demand calculation (experimental series)
- [x] Dynamic series index adjustment (latestData always on top)

**Next steps** (potential):
- [ ] Selection behavior for date ranges (start/end picking)
- [ ] Backtesting tab wiring
- [ ] Loading indicator for Fourier calculation

---

## Completed: UI Expansion (Task 3)

**Goal**: Add navigation menu entries and placeholder frames for upcoming features.

**New frames added**:
- Event Screener (`eventscreenerframe`)
- Forex Screener (`forexscreenerframe`)
- Börsen Ampel (`trafficlightframe`)

---

## Completed: Seasonality Analysis

**Goal**: Finish the seasonality feature with real data from datahub.

**Services Available**:
- `sentinel-backend.dotv.ee` - Macrodata
- `sentinel-datahub.dotv.ee` - Historic EOD data (for seasonality)
- `sentinel-access-manager-dev.dotv.ee` - Auth

**Deployment**: Automated via output submodule push.

**Progress**:
- [x] Connect to datahub for real historic data
- [x] Transform datahub response to cache structure (datacache.coffee)
- [x] Symbol search combobox with fuzzy filtering
- [x] Refactor: consolidated date/factor utilities into utilsmodule
- [x] Refactor: clean module boundaries (seasonality internal to marketdatamodule)
- [x] Define marketdatamodule interface for seasonalityframemodule
- [x] Wire datacache → marketdatamodule → seasonalityframemodule
- [x] Implement seasonality composite calculation with real data
- [x] Display composite + latest move in chart
- [x] Fixed chart NaN bug (year indexing in digestRemoteData)

## Datahub Integration

**Performance** (observed):
- Cached in datahub: 200-350ms for ~10k datapoints
- Uncached (datahub fetches from source): 4-7s

**Response format**:
```coffee
{
    meta: { startDate, endDate, interval: "1d", historyComplete }
    data: [...] # array of [high, low, close] per trading day
}
```

**Freshness tolerance**: 5 days - acceptable staleness for our use case.

## Datacache (implemented in `marketdatamodule/datacache.coffee`)

**Public Interface**:
- `getLatestCloseData(dataKey)` → close data for current + last year
- `getHistoricCloseData(dataKey, toAge)` → close data for `toAge` years back
- `getHistoricHighLowData(dataKey, toAge)` → [high, low] pairs for `toAge` years back
- `getHistoryHLC(dataKey, toAge)` → raw [h,l,c] data (other functions use this)

**Internal Structure**:
```coffee
keyToHistory = {
    "GOOGL": [year0, year1, year2, ...]  # year0 = current (incomplete)
}
# Each year: [[h,l,c], ...] with 365/366 entries, indexed by day-of-year
# Incomplete positions filled with `null`
```

**Key decisions**:
- Calendar years (not rolling 365 days)
- In-memory only (file persistence deferred, see deferred.md)
- Always fetch max (30 years), slice locally for analysis range
- Current year (index 0) and oldest year may be incomplete
- Lazy loading: fetches on first access, retries on failure
- Error handling: silent empty array (option 1), no error propagation

**Next step**: Define marketdatamodule interface, then wire datacache into it.

## Module Dependencies (Seasonality Feature)

```
seasonalityframemodule
  ├─ comboboxfun (symbol combobox UI)
  │    └─ symboloptions (search logic)
  ├─ chartfun (uPlot chart rendering)
  │    └─ utilsmodule (date helpers)
  ├─ utilsmodule (dates, factors, FEB29/FEB28 constants)
  └─ marketdatamodule (data interface - to be defined)

marketdatamodule
  ├─ datacache (fetch + cache)
  ├─ seasonality (calculation algorithms)
  └─ [sampledata] (mock data, commented out)

datacache
  ├─ utilsmodule (getDaysOfYear, getDayOfYear)
  └─ scimodule (getEodData → datahub)

seasonality (internal to marketdatamodule)
  └─ utilsmodule (isLeapYear, FEB29/28, factor functions)
```

**Design principles**:
- seasonalityframemodule only knows about marketdatamodule for data, not the internals
- comboboxfun and chartfun are stateless UI components with callback/parameter interfaces

## Seasonality Frame Module Structure

**Files** (refactored for separation of concerns):
- `seasonalityframemodule.coffee` - Coordinator: state, data retrieval, UI class management
- `comboboxfun.coffee` - Combobox UI: filtering, keyboard nav, dropdown
- `chartfun.coffee` - uPlot chart rendering, axis interactions, cursor indicator
- `symboloptions.coffee` - Search logic with rate limiting
- `seasonalityframe.pug` - HTML structure
- `styles.styl` - Main styling + imports
- `visibility.styl` - Conditional visibility rules based on state classes

**UI State Classes** (on `#seasonalityframe`):
- `.chart-inactive` (default): Shows instructions, hides chart and close button
- `.chart-active`: Shows chart (`#seasonality-chart`) and close button
- `.check-components`: Enables chart components tab (default when chart active)
- `.backtesting`: Enables backtesting tab and details (future feature)

**State transitions**:
```
chart-inactive → (user selects symbol) → chart-active + check-components
chart-active   → (user clicks close)   → chart-inactive (reset all state)
```

**Module Interfaces**:
```coffee
# comboboxfun - Combobox class
box = new Combobox({ inputEl, dropdownEl, optionsLimit, minSearchLength })
box.onSelect(callback)           # Attach selection handler
box.setDefaultOptions()          # Sets fullOptions from symboloptions.defaultTop100
box.provideSearchOptions(opts)   # Sets fullOptions to server results, refilters

# chartfun
drawChart(container, xAxisData, adrData, fourierData, latestData)  # fourierData can be null
resetChart(container)
toggleSeriesVisibility(seriesIdx, isVisible)  # Show/hide series via uPlot

# symboloptions
dynamicSearch(searchString, limit, requester)  # Rate-limited, calls requester.provideSearchOptions(results)
defaultTop100                                   # Array of {symbol, name}
```

**Cursor Indicator**:
- `#cursor-indicator` with `.location` span shows current date (dd.mm.yyyy)
- Visible (`.shown` class) when cursor is over chart
- Hidden when cursor leaves chart or chart is reset

**Combobox Behavior**:
- Constructor calls `setDefaultOptions()` → loads `defaultTop100` into `fullOptions`
- `currentOptions` derived from `fullOptions`: sliced to `optionsLimit` (no query) or fuzzy-ranked (with query)
- Fuzzy scoring: counts matched chars in order, sorts by best score (symbol vs name)
- At 3+ chars, triggers `dynamicSearch(query, limit+20, this)` → server-side search
- Server results arrive via `provideSearchOptions(opts)` → replaces `fullOptions`, refilters
- Query too short → `setDefaultOptions()` resets to defaults
- Keyboard: arrows navigate, Enter selects, Escape closes
- Rate limiting: 200ms cooldown on server requests (in symboloptions)

**Data flow**:
```
User types → Combobox.onInput → updateCurrentOptions (fuzzy rank from fullOptions)
                              → if query < minSearchLength: setDefaultOptions()
                              → if query >= minSearchLength: dynamicSearch(query, limit, this)
                                    ↓
                              scimodule.getSymbolOptions(searchString, limit)
                                    ↓
                              Combobox.provideSearchOptions(results) → fullOptions = results → refilter

User selects → Combobox calls selectionCallback(symbol)
             → seasonalityframemodule.onStockSelected
             → resetAndRender → retrieveRelevantData (fetches ADR only)
             → prepareChartData → redrawChart → chartfun.drawChart
             → updateYearsIndicator (sets #aggregation-years-indicator)
             → setChartActive() (adds chart-active, check-components classes)

User clicks legend series → onLegendSeriesClick
  - Regular series (ADR/latest): toggleSeriesVisibility via uPlot
  - Experimental (Fourier):
    → ensureFourierData (fetch + prepare if not cached)
    → redrawChart (rebuilds chart with/without Fourier)
    → updateSeriesIndices (latestData index: 2 or 3)

User closes → onCloseChart
            → resetSeasonalityState → chartfun.resetChart
            → clear symbol input, selected symbol, currentSelectedStock
            → reset Fourier visibility class
            → resetTimeframeSelect (back to "5 Jahre" only)
            → setChartInactive() (adds chart-inactive, removes chart-active/check-components)
```

**State Variables** (seasonalityframemodule):
```coffee
adrAggregation   # Average Daily Return - prepared for 2-year display
frAggregation    # Fourier Regression - on-demand, cached until reset
latestData       # Current + last year price data - prepared for 2-year display
xAxisData        # Time axis for chart
```

**Chart Components (legend)** (`chart-components.pug`):
- `.legend-series` elements with `series-index` attribute
- Click toggles `.visible` class and series visibility
- `.experimental` class marks Fourier (triggers on-demand calculation)
- `#aggregation-years-indicator` shows current timeframe (5/10/15/etc)
