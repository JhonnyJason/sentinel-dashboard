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

**Templating**: Mustache templates embedded in pug, rendered at runtime.

**Imports**: All `.coffee` files transpile to same directory (`toolset/build/js/`), so imports use flat paths like `"./scimodule.js"` regardless of source folder structure.

### File Locations for Common Tasks

| Task | Location |
|------|----------|
| Add new currency pair | `configmodule.coffee` -> `shownCurrencyPairLabels` |
| Modify scoring algorithm | `scorehelper.coffee` |
| Add new economic area | `economicareasmodule.coffee` |
| Change chart behavior | `seasonalityframemodule.coffee` |
| Modify auth flow | `accountmodule.coffee`, `scimodule.coffee` |
| Add new UI state | `uistatemodule.coffee`, `navtriggers.coffee` |

### Current State (as of review)

**Features Implemented**:
- Login/logout with session management
- Economic area display with live data
- Currency pair trend scoring
- Seasonality charting (basic)

**Incomplete/TODO areas** (found in code):
- `seasonalityframemodule`: Time axis handling, selection behavior
- `marketdatamodule`: `getSeasonalityComposite` returns hardcoded data
- Service worker: Minimal implementation

### External Dependencies Worth Knowing
- `navhandler` - URL-based state management
- `secret-manager-crypto-utils` - SHA256 hashing
- `thingy-schema-validate` - Runtime type validation
- `uplot` - Lightweight charting
- `fft.js` - Fourier transform for seasonality

## Current Focus: Seasonality Analysis

**Goal**: Finish the seasonality feature with real data from datahub.

**Services Available**:
- `sentinel-backend.dotv.ee` - Macrodata
- `sentinel-datahub.dotv.ee` - Historic EOD data (for seasonality)
- `sentinel-access-manager-dev.dotv.ee` - Auth

**Deployment**: Automated via output submodule push.

**Progress**:
- [x] Connect to datahub for real historic data (testFetch works)
- [x] Transform datahub response to cache structure (datacache.coffee)
- [ ] Implement seasonality composite calculation:
  - Average daily return method (exists, needs real data)
  - Fourier method
- [ ] Display composite + latest move in chart

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

**Next step**: Wire datacache into marketdatamodule for seasonality composite calculation.
