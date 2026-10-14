# Task
Small side tasks:
- In the Event Screener - dont do an automatic screening run on startup.
- Add 3 New Partners with Affiliate Links (logos can be found in sources/ressources/img/...):
    - Tickmill: https://go.tickmill.com/visit/?bta=37576&brand=tickmill
    - WHSelfinvest: https://www.whselfinvest.com/de-de/trading/information/kunden/beziehung?pid=e165421110ba03099a1c0393373c5b43&pdffile=43
    - GBE Brokers: https://login.gbebrokers.com/rx?ca=2585
- For every Partner section adds a new special Hint that when using the the affilate Link they will receive a special price for the Sentinel. (We can add the same text and just keep it very general without the specific details - I have to check with the Customer to about what are the exact conditions that apply - so we can fill the details later, but it should already be "presentable")

## Details
- Event Screener: `activate` only loads the stored symbols (`retrieveMissingSymbolData`) instead of `generateScreeningResult`; the screen button becomes active once symbols + events are set.
- Partners: logos as `img(src="/img/...")`; GBE logo extracted from `GBE-Brokers.rar` (no tagline, 393px) → `gbe-brokers-logo.png`.
- Sentinel hint: one pug mixin `+sentinelOffer` in `partnersframe.pug`, general text for now - exact conditions per partner later.

## Sub-Tasks
- [x] 1. Event Screener: no automatic screening run on activate.
- [x] 2. Partners: Tickmill, WH SelfInvest, GBE brokers (logo, description, website, affiliate link).
- [x] 3. Partners: `+sentinelOffer` hint in every partner entry + style.
- [ ] 4. Check in the browser (initial screener state, partner page layout).
- [ ] 5. Later: exact Sentinel conditions per partner.
