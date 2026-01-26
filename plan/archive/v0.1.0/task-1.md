# Task 1
Implement Real data retrieval from datahub

## Details
The Datahub has just been implemented will return a dataSet when requested for data with a  valid authCode.
We should retrieve valid data and temporarily store them. First for an unlimited time but maybe we should make our design easy to limit it to a certain number of dataSets to not eat away all the RAM.

Returned dataSet should have the format:
{meta:{startDate, endDate, interval, completeHistory}, data:[dataPoint]}

Where dataPoint is [high, low, close] an array of 3 floats. 

## Sub Tasks
- [x] Test general data retrieval
- [x] Implement the real datastructure to easily retrieve data by years of history