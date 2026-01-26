# The Sentinel Dashboard

This is the UI of the EWAG Sentinel.
It's main purpose is to help retail traders to find an Edge to the market.

Therefore we have for now:
- Makrodata Analysis of Economic areas -> Forex Scoring
- Seasonality Research -> Screening

There might be more to come ;-)

## The System
We have separated out a few componets:
- Sentinel Dashboard (This UI project here)
- Sentinel Access Manager (Does the login and validates if a user has access to Data -> grants or revokes access for some timeframe on the Backend and the Datahub)
- Sentinel Backend (Does the Makrodata aggregation)
- Sentinel Datahub (Does historic EOD data aggregation)


---

# License
[Unlicense JhonnyJason style](https://hackmd.io/nCpLO3gxRlSmKVG3Zxy2hA?view)

