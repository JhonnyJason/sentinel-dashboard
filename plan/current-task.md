# Task
Trades chart: create a missing stop-loss / take-profit level by pressing into the chart.

## Details
- Module: `equityperformancemodule` (trades chart `#equity-trades-chart`).
- Press inside the plot area (`tradesChart.over`):
  - value > 0 and take-profit off → take-profit at that level
  - value < 0 and stop-loss off → stop-loss at that level
  - otherwise (that level already exists, or exactly 0) → nothing; an existing line is dragged as before
- Value via `tradesChart.posToVal`, written to the input with the same rounding and 0.1% clamp as the drag → `onControlsChanged()`; the inputs stay the single source of truth.
- Create and drag in one gesture: the new line takes the pointer capture, its existing drag handler moves it on.
- Mouse: create + grab on pointerdown.
- Touch: vertical drag and page scroll share the direction, so `touch-action: pan-y` (as in the seasonality select) does not work. Decided by speed:
  - first move fast → swipe, the page scrolls, nothing created
  - first move slow, or held still for `holdMs` → create + grab; `touchmove` gets `preventDefault` (no scroll)
  - tap → create only
  - the non-passive `touchmove` listener sits on the touched node itself: the render detaches it, and events to a detached node no longer bubble.
- Cursor hint (mouse): crosshair over the plot only where a press would create a level.
- Seasonality select (`seasonalitychartmodule` `attachTouchSelect`): has no timeout; direction-based via `touch-action`, felt delay = browser direction detection + `minDragPx = 10`. Untouched here.

## Sub-Tasks
- [x] Factor the pointer → level conversion out of `onLevelDrag` (shared by drag and create)
- [x] Press handling on `equityTradesChart`: mouse immediate, touch speed/hold/tap
- [x] Cursor hint via a class on `equityTradesChart`
- [x] Update `equityperformancemodule/README.md`
- [ ] Check in the browser: mouse + touch, create, create-and-drag, swipe still scrolls, existing level side ignored
