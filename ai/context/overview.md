# Sentinel Dashboard - Overview

## Purpose
PWA dashboard (German UI) for retail forex/stock traders to find market edges:
macrodata scoring of currency pairs, seasonality research with backtesting,
event/forex screeners and a market "traffic light".

## System
- **Sentinel Dashboard** (this project) - the UI
- **Access Manager** - auth, accounts, subscriptions (`scimodule`)
- **Backend** - macrodata over WebSocket (`datamodule`)
- **Datahub** - historic EOD data (`scimodule.getEodData`) + live prices over WebSocket (`livedatamodule`)
- **Link Guardian** - external link handling

URLs live in `configmodule` (localhost in dev, production hosts when served from the prod origin).

## UI States
`uistatemodule` applies a base state; `navtriggers` + `navhandler` drive navigation.
States: summary, currencytrend, seasonality, eventscreener, forexscreener,
optionscreener, sectorrotation, trafficlight, partners, account, noaccount.
`contentmodule` / `sidenavmodule` switch visible frames per state.

## Modules (`sources/source/`)

### Core
| Module | Purpose |
|--------|---------|
| `appcoremodule` | startup, navigation state handling, service worker |
| `configmodule` | URLs, currency pair list, timing constants |
| `accountmodule` / `scimodule` | auth flow / HTTP to Access Manager + Datahub |
| `datamodule` | macrodata WebSocket + heartbeat, event list |
| `livedatamodule` | live price WebSocket to Datahub, per-symbol listeners |
| `statemodule` | persisted app state (localStorage) with change listeners |
| `utilsmodule` | date/leap-year helpers, factor math, weekday adjustments |

### Market data
| Module | Purpose |
|--------|---------|
| `marketdatamodule` | public data interface: seasonality composites, latest data |
| `marketdatamodule/datacache` | fetches full EOD history once, buckets it by year / month / week |
| `marketdatamodule/seasonality` | seasonality calculations (ADR) |
| `hlcbacktestingmodule` | `SymbolBacktester` - backtests on HLC history (shared by seasonality + screeners) |
| `symboloptionsmodule` / `symbolselectmodule` / `fuzzyscoremodule` | symbol list, `SymbolSelect` widget, fuzzy search |

### Features
| Module | Purpose |
|--------|---------|
| `seasonalityframemodule` | coordinator: symbol, history range, chart timeframe, cycle, tabs |
| `seasonalitycyclesmodule` (+ `cyclemath`) | cycle definition (unit, size, anchor, presets) + compact cycle table |
| `seasonalitychartmodule` | `SeasonalityChart` (uPlot), range selection |
| `seasonalitybacktestingmodule` | backtest of the selected range: summary + details table |
| `scoring/` + `economicareamodule` | parameterized macro scoring per area (see `scoring/README.md`) |
| `currencytrendframemodule` / `summaryframemodule` | currency pair ranking / summary view |
| `eventscreenerframemodule` (+ `eventtradechartmodule`, `eventtradedetailsmodule`) | event-based trade screener |
| `forexscreenerframemodule` (+ `forexlivedata`) | forex screener combining scores, seasonality, live prices |
| `trafficlightframemodule` (+ `traffliclightdata`) | SPY chart with HYG-EMA state bands, zoom |
| `optionscreener`, `sectorrotation`, `partners`, `placeholder` frames | mostly placeholders / static |

## Current Focus
Seasonality - cycles editor rework (`plan/current-task.md`).
