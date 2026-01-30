# Task 7
Seasonality Backtesting display details

## Details
The backtesting functionality works and responds with a summary and a result list for each year.
This `yearlyResults` look like this: `[{ year, profitP, maxRiseP, maxDropP, warn }, ...]`
These results should be rendered into the #backtesting-details-table.
Each column shall be clickable for sorting functionality - toggling betwen ascending and descending sort for the associated property. The values are numbers and thus easily sortabl ;-)
The label warn does not have its own column, it simply adds a class on the table row which should give it a slight reddish background.
If we have a true `warn` boolean in the general results - this means we have one or many potential yearlyResults with a `warn` of true. In this case we should set the warning paragraph beneath the table to be visible. Otherwise we should keep it hidden.

The relevant files are all in sources/source/seasonalityframemodule/


## Sub-Tasks
- [x] render the table
- [x] wire up the event listeners for sorting
- [x] represent the sorting state appripriately with visible arrow in the <th> element
- [x] Style the Table appropriately
- [x] Test and fix issues in function structure and style