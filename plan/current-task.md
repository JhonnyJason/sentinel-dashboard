# Task 2
Implementation of User choices.


## Details 
In the seasonalityframemodule, we have a few inputs for users to choose:
- What stock symbol they want to analyse
- Which calculation method they want to use
- The timeframe of the seasonality composite

There are defaultOptions (~500) available in symboloptions.coffee
The user should be able to type then non-case-sensitive and fuzzy find the filtered symbols.
Also we will have a backend where we may send what the user has typed to retrieve generally searchable symbols of about ~7k+ symbols.
Symboloptions should implement this dynamic retrieval of options depending on the typed string without overloading the server by spamming requests.

## Sub-Tasks
- [x] Add combo-box into the structure for flexible search-selecting
- [ ] implement sample flow of search-selecting with dynamically requested data
- [ ] implement top-down flow from user selecting what to analyse to calling the correct data retrieval interface
- [ ] Test and fix user choices flows