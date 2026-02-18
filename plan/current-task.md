# Task 9
Update v0.1.3


## Details
There are a few Updates to be made from feedback of the testers:

### Updates trafficlightmodule
- [x] trafficlight: new Text for each color state
- [x] trafficlight: add zoom levels: "Maximal", "12 Monate", "6 Monate" and "3 Monate"
- [x] trafficlight: subscribe to liveData of HYG for more up-to date indication

### Updates seasonalityframemodule
- [x] seasonalityframe backtesting: correct absolute values by using the splitFactors in the meta data
- [x] seasonalityframe summary: Add absolute Values for "Max Anstieg" and "Max Rückgang"
- [ ] seasonalityframe details: Remove year and add startDate and endDate (adjusted for weekends)
- [ ] seasonalityframe chart: backtesting timeframe change should preserve set Backtesting values and reselect the same timeframe


## Sub-Tasks
- [x] Update tests for the trafficlightframe
- [x] Implement Zoom feature to choose from ["Maximal", "12 Monate", "6 Monate", "3 Monate"]
- [x] Implement subscription on liveData on the Datahub
- [x] Implement correction of absolute values in backtesting
- [x] Implement addition of absolute values in backtesting-summary
- [ ] change Table in backtesting details to show weekend-adjusted startDate and EndDate instead of the Year