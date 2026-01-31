# Task 8
Implement Updated ForexScoring

## Details
The CurrencyTrendframemodule and in the Economicareasmodule we have a basic logic (mostly hardcoded Score levels) which allows to calculate a realative Forex Score.
Now this needs to be updated such that we have parameterized Formulas.

For the picture of what needs to be calculated we draw it from the solution back to the roots:

- score = i * inflationScore + l * interestScore + g * gdpScore + c * cotScore
- i, l, g and c are weights that might be adjusted and optimized for
- inflationScore = InflationDiffCurve(BaseArea.normalizedInflation(), QuoteArea.normalizedInflation())
- InflationDiffCurve: Here we need to define a parameterized curve for calcuationg a score such that we may optimize the parameters and thus the shape of the curve. Also we need to define a function that is parameterized by the EconomicArea to give us a "normalized" inflationScore which is comparable across Economic Areas -> (adjust for cultural differences^^)
- interestScore = InterestDiffCurve( BaseArea.data.mrr * BaseArea.mrrF + QuoteArea.data.mrr * QuoteArea.mrrF )
- The "parameterized" Curve here will be a polynomial of 3rd degree. Like: interestScore = s*(baseMrrW - quoteMrrW)^3 Where baseMrrW is the weighed mrr from the baseArea here it is a simply factor for the purpose of cultural adjustment and the result is scaled by another weight s.
- GDP works in exaclty the same way as inflation
- COT works similar like the Interest Score However we first combine the COT scores into   areaNormalizedCOT = areaCOTF * (areaCOT6 / 33) * (areaCOT36 / 33)^2 and then calculate cotScore = t * (baseAreaNormalizedCOT - quoteAreaNormalizedCOT)^3 where the result is scaled by the weight t.

First the full picture needs to be reviewed and it needs to ba assured that positive results are correctly representing a bullish trend in the baseCurrency/quoteCurrency trading Pair.
Also we need to ensure that the ranges for the results are adequately adjusted and cut off at certain levels. E.g. inflation of 80% vs inflation of 50% might have a disproportional effect while realistically being less relevant at this point. So a cut-off at a certain level which would be around 20% for developed Countries and 30 to 40% for Countries with an inflationary tradition could make sense.

## Sub-Tasks
- [x] review the Calculation flows and function shapes parameterization ranges
- [ ] document the Scoring Design
- [ ] implement the new Score updating flow
- [ ] test and review

