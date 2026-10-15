# Task
Implement Chancen-Risiko profil.
A very rough illustration is shown in chance-risk-profile.jpg

## Details
In the seasonalityframe in together with the backtesting details table and the performance curve, we shall have the Tab labelled "Chancen-Risiko-Profil", order: Performance, Chancen-Risiko-Profil, Details.
- We donot need to display the smooth gaussian function there, naturally the Barchart would resembel a gaussian shape + some noise.
- The center is 0% then each Bar Chart left and right resembles a range e.g ( 0 to -0.5%) And the Number associated with that Barchart is the number of days the price was in that range.
- The effective size of each bars' requires some experimentation and might also depend on the effective distribution in the results.
- Then each bar should actually be split in 2 bars a reddish Bar which represents the part where the trade then resulted in a loss. Then a greenish Bar on Top which represents the the part where the trade resulted in a profit. 

## Decisions
- Value per trade-day: daily close's price change vs. entry (`closeF` from `path`, short sign undone). Colour = trade result, so long/short shows in the colours.
- Raw trades: `simulate(summary, {})` - no stop-loss / take-profit / fees, independent of the Performance tab controls. Win/loss = raw `profitF > 0`.
- Bins: 0 is always an edge. Width = half the Freedman–Diaconis width `IQR·n^(-1/3)`, rounded to the nearest nice step (0.1 / 0.2 / 0.25 / 0.5 / 1 / 2 / 2.5 / 5 %). Range = min..max (incl. 0) snapped to multiples of `w`, no clipping. Bin count kept within 10–100 by stepping the nice width.
- Stacked bars: losing trades red at the bottom, winning trades green on top. Height = number of trade-days.
- x-axis: % ticks on the bin edges, white vertical 0% line, bars max 40px. No gaussian curve, no σ / mean markers, no tooltip.

## Sub-Tasks
- [x] New module `chanceriskprofilemodule` (`npm run add-module`): `setResults(summary)`, binning as pure function + small unit test
- [x] Tab "Chancen-Risiko-Profil" in `backtesting-details.pug`, panel includes the module's pug
- [x] uPlot stacked bar chart (render only while visible, ResizeObserver, like `equityperformancemodule`)
- [x] Call `setResults` from `seasonalitybacktestingmodule.run`
- [x] Module `README.md`, update `ai/context/overview.md`
- [ ] Check in the browser, tune bin count if needed