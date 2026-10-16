// seasonality: block ranges and block returns for the bar chart
import { test } from "node:test"
import assert from "node:assert/strict"
import { blockRanges, calculateBlockReturns } from "../.build/seasonality.js"

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`)

test("blockRanges: yearly months cover the 366 slots, Feb incl. the Feb 29 slot", () => {
  const r = blockRanges("yearly", "months")
  assert.equal(r.length, 12)
  assert.deepEqual(r[0], [0, 31])
  assert.deepEqual(r[1], [31, 60]) // Feb 29 = slot 59
  assert.deepEqual(r[11], [335, 366])
})

test("blockRanges: quarterly months, days per timeframe, invalid combos throw", () => {
  assert.deepEqual(blockRanges("quarterly", "months"), [[0, 31], [31, 62], [62, 93]])
  assert.equal(blockRanges("yearly", "days").length, 366)
  assert.equal(blockRanges("quarterly", "days").length, 93)
  assert.equal(blockRanges("monthly", "days").length, 31)
  assert.deepEqual(blockRanges("weekly", "days")[6], [6, 7])
  assert.throws(() => blockRanges("monthly", "months"))
  assert.throws(() => blockRanges("yearly", "weeks"))
})

// chunks newest first, chunk 0 = unfinished current period (never counted)
test("calculateBlockReturns: plain mean of % returns, min / max, links to the previous chunk", () => {
  const chunks = [
    [999, 999, 999, 999],     // chunk 0: ignored
    [110, 110, 121, 121],     // from 100: block 0 +10%, block 1 +10%
    [100, 105, 80, 100],      // oldest: block 0 +5% (slot 0 has no previous close), block 1 -4.76..%
  ]
  const { avg, min, max } = calculateBlockReturns(chunks, [[0, 2], [2, 4]])
  near(avg[0], 7.5, "block 0 avg")     // mean of +10% (from the oldest chunk's 100) and +5%
  near(avg[1], (10 + 100 * (100 / 105 - 1)) / 2, "block 1 avg")
  near(min[1], 100 * (100 / 105 - 1), "block 1 min")
  near(max[1], 10, "block 1 max")
})

test("calculateBlockReturns: mean of % returns, not of logs", () => {
  const chunks = [[1], [200], [50], [100]] // +300%, -50% (from 100 to 50) -> mean of % = 125
  const { avg } = calculateBlockReturns(chunks, [[0, 1]])
  near(avg[0], (300 - 50) / 2, "avg")
})

test("calculateBlockReturns: missing slots are no sample, isIncluded filters chunks", () => {
  const chunks = [
    [null, null],
    [null, null],   // e.g. weekend in this year: no sample, not 0%
    [120, null],    // from 100: +20%
    [null, 100],
  ]
  const all = calculateBlockReturns(chunks, [[0, 1], [1, 2]])
  near(all.avg[0], 20, "only one sample")
  assert.equal(all.avg[1], null)       // oldest chunk has no previous close
  assert.equal(all.min[1], null)

  const onlyChunk1 = calculateBlockReturns(chunks, [[0, 1]], (k) => k == 1)
  assert.equal(onlyChunk1.avg[0], null)
})
