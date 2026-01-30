# Task 6
Implement Backtesting functionality

## Details
Calculate backtesting statistics for selected date ranges across historic years.

## Sub-Tasks
- [x] Index normalization (normalizeSelectionIndices)
- [x] HLC sequence extraction (regular + overlapping cases)
- [x] Per-sequence backtesting (backtestSequence → changeF, maxRiseF, maxDropF, warn)
- [x] Aggregate results across years (avg/median of changeF, extremes of maxRise/maxDrop)
- [x] Direction detection (avg changeF > 1 → Long, else Short)
- [x] Win rate calculation (% of years with profit in detected direction)
- [x] return correct result Object
- [x] Format for UI (factors → percentages, date strings)
