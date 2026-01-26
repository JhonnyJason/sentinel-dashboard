# Sentinel Dashboard - Overview

## Purpose
A PWA dashboard for retail forex/stock traders to find market edges through:
1. **Macrodata Analysis** - Economic area scoring for forex pairs
2. **Seasonality Research** - Historical pattern screening

## System Architecture
The Sentinel Dashboard is one part of a larger system:
- **Sentinel Dashboard** (this project) - The UI/PWA
- **Sentinel Access Manager** - Authentication and access control
- **Sentinel Backend** - Macrodata aggregation (WebSocket)
- **Sentinel Datahub** - Historic EOD data aggregation

## Tech Stack
- **Language**: CoffeeScript (~2700 lines)
- **Build**: Custom "thingy-build-system" (webpack, pug, stylus)
- **UI**: Vanilla JS, Mustache templates, uPlot for charts
- **Auth**: Token-based with SHA256 hashed passwords
- **Data**: WebSocket connection to backend

## Module Structure (`sources/source/`)

### Core Modules
| Module | Purpose |
|--------|---------|
| `appcoremodule` | App initialization, navigation state handling, service worker |
| `configmodule` | Config constants (URLs, currency pairs, timing) |
| `datamodule` | WebSocket connection to backend, heartbeat |
| `uistatemodule` | UI state machine (summary/currencytrend/seasonality/account/noaccount) |
| `navtriggers` | Navigation action wrappers using `navhandler` |
| `accountmodule` | Authentication flow (login, logout, session refresh) |
| `scimodule` | Server Communication Interface - HTTP requests to Access Manager |

### Feature Modules
| Module | Purpose |
|--------|---------|
| `economicareamodule` | Economic area data (Eurozone, USA, Japan, UK, etc.) with indicators |
| `currencytrendframemodule` | Currency pair scoring based on economic data |
| `scorehelper` | Scoring algorithms for interest, inflation, GDP, COT |
| `seasonalityframemodule` | Seasonality feature coordinator - state, data retrieval, wiring |
| `seasonalityframemodule/comboboxfun` | `Combobox` class - fuzzy-ranked filtering, keyboard nav, dropdown |
| `seasonalityframemodule/chartfun` | uPlot chart rendering and axis interactions |
| `seasonalityframemodule/symboloptions` | Rate-limited symbol search with requester callback, default S&P 500 list |
| `marketdatamodule` | Market history data interface for seasonalityframemodule |
| `marketdatamodule/datacache` | EOD data cache, fetches from datahub via scimodule |
| `marketdatamodule/seasonality` | Seasonality calculation algorithms (internal) |
| `fouriermodule` | FFT analysis for seasonality patterns |

### UI Modules
| Module | Purpose |
|--------|---------|
| `headermodule` / `footermodule` | Page structure |
| `sidenavmodule` | Navigation sidebar |
| `contentmodule` | Main content area switching |
| `accountframemodule` | Account management UI |
| `noaccountmodule` | Login/registration UI |
| `summaryframemodule` | Dashboard summary view |
| `svgiconsmodule` | SVG icon definitions |
| `utilsmodule` | Shared utilities: date helpers, factor array math, leap year constants |

## UI States (Navigation)
```
noaccount -> (login) -> summary
summary <-> currencytrend <-> seasonality <-> account
```

## Data Flow
1. User logs in via `scimodule` -> Access Manager
2. `accountmodule` stores session in localStorage
3. `datamodule` opens WebSocket to Backend
4. Backend pushes data -> `summaryframemodule.updateData()`
5. Data propagates to `economicareamodule` -> `currencytrendframemodule`

## Economic Areas Tracked
EUR, USD, JPY, GBP, CAD, AUD, CHF, NZD

## Key Indicators
- **HICP** - Inflation rate
- **MRR** - Main Refinancing Rate (policy rate)
- **GDPG** - GDP Growth
- **COT Index** - Commitment of Traders (6-week and 36-week)

## Build Commands
- `pnpm test` - Development server with hot reload
- `pnpm run check-deployment` - Build and serve production version
- `pnpm run deployment-build` - Production build only
