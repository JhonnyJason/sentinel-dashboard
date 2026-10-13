// seasonality: preparation, factor step and ADR core - edge cases
import { test } from "node:test"
import assert from "node:assert/strict"
import { calculateSeasonalityComposite, averageDailyReturn, toLogFactorArrays, normalizeYearData } from "../.build/seasonality.js"

const L = Math.log
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`)
const ratio = (c, i) => c[i] / c[i - 1] // change into slot i-1

// ---------- mimic datacache: daily series -> buckets -> close extractor ----------
const DAY = 86400000
const isLeap = (y) => (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
// price(date, prevClose) -> close; one entry per calendar day (weekends carry the close)
function series(from, to, price) {
  const days = []
  let close = 100
  for (let t = Date.UTC(...from); t <= Date.UTC(...to); t += DAY) {
    const d = new Date(t)
    close = price(d, close)
    days.push([d, close])
  }
  return days
}
// keyFn -> chunk key, idxFn -> slot, size -> slot count; returns newest first like datacache
function chunks(days, keyFn, idxFn, sizeFn) {
  const buckets = new Map()
  for (const [d, c] of days) {
    const k = keyFn(d)
    if (!buckets.has(k)) buckets.set(k, new Array(sizeFn(d)))
    buckets.get(k)[idxFn(d)] = c
  }
  return [...buckets.keys()].sort((a, b) => b - a).map((k) => buckets.get(k))
}
const yearly = (days) => chunks(days,
  (d) => d.getUTCFullYear(),
  (d) => (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY,
  (d) => isLeap(d.getUTCFullYear()) ? 366 : 365).map(normalizeYearData)
const monthly = (days) => chunks(days,
  (d) => d.getUTCFullYear() * 100 + d.getUTCMonth(), (d) => d.getUTCDate() - 1, () => 31)
const weekday = (d) => (d.getUTCDay() + 6) % 7 // Mon = 0
const weekly = (days) => chunks(days,
  (d) => Math.floor((d.getTime() - weekday(d) * DAY) / DAY), weekday, () => 7)

const adr = (data) => calculateSeasonalityComposite(data, 0)

// ---------- averageDailyReturn ----------
test("throws on differing lengths", () => {
  assert.throws(() => averageDailyReturn([[0, 0], [0, 0, 0]]), /differ in length/)
})
test("empty input -> just the start point", () => {
  assert.deepEqual(averageDailyReturn([]), [100])
})
test("null / undefined don't count in the divisor", () => {
  const c = averageDailyReturn([[L(2), null], [undefined, L(4)]])
  near(c[1], 200, "slot 0 only from chunk 0")
  near(c[2], 800, "slot 1 only from chunk 1")
})
test("index without samples stays neutral", () => {
  const c = averageDailyReturn([[L(2), null, L(2)], [L(2), undefined, L(2)]])
  near(c[2], c[1], "neutral slot")
  near(c[3], 400, "curve continues")
})
test("non-finite factors are ignored", () => {
  const c = averageDailyReturn([[Infinity], [NaN], [L(3)]])
  near(c[1], 300, "only the finite one")
})
test("real 0% day counts as a sample", () => {
  const c = averageDailyReturn([[0], [L(4)]])
  near(c[1], 200, "average of log(1) and log(4) = log(2)")
})

// ---------- preparation ----------
test("normalizeYearData: non-leap year gets null FEB29, rest shifted", () => {
  const year = Array.from({ length: 365 }, (_, i) => i)
  const y = normalizeYearData(year)
  assert.equal(y.length, 366)
  assert.equal(y[58], 58, "Feb 28")
  assert.equal(y[59], null, "FEB29 non-existent")
  assert.equal(y[60], 59, "Mar 1")
  assert.equal(y[365], 364, "Dec 31")
})
test("normalizeYearData: leap year unchanged", () => {
  const year = new Array(366)
  assert.equal(normalizeYearData(year), year)
})

// ---------- factor step ----------
test("factor step: oldest slot 0 undefined, explicit (no sparse hole)", () => {
  const f = toLogFactorArrays([[2], [1]])
  assert.equal(f[1][0], undefined)
  assert.ok(Object.prototype.hasOwnProperty.call(f[1], 0), "explicit undefined")
  near(f[0][0], L(2), "crosses boundary")
})

// ---------- methods ----------
test("Fourier (method 1) is disabled -> undefined", () => {
  assert.equal(calculateSeasonalityComposite([[1], [1]], 1), undefined)
})

// ---------- yearly ----------
test("yearly: constant prices -> flat curve with 367 points", () => {
  const c = adr(yearly(series([2015, 0, 1], [2025, 5, 15], (d, p) => p)))
  assert.equal(c.length, 367)
  c.forEach((v) => near(v, 100, "flat"))
})
test("yearly: non-leap FEB29 neutral, Mar 1 compares to Feb 28", () => {
  // 2017-2019 all non-leap; +1% on Mar 1
  const up = (d, p) => (d.getUTCMonth() == 2 && d.getUTCDate() == 1 ? p * 1.01 : p)
  const c = adr(yearly(series([2017, 0, 1], [2020, 0, 10], up)))
  near(ratio(c, 60), 1, "FEB29 slot (59) neutral")
  near(ratio(c, 61), 1.01, "Mar 1 (slot 60)")
})
test("yearly: FEB29 averaged only over leap years", () => {
  // +2% on Feb 29 (only exists in 2016, 2020)
  const up = (d, p) => (d.getUTCMonth() == 1 && d.getUTCDate() == 29 ? p * 1.02 : p)
  const c = adr(yearly(series([2015, 0, 1], [2022, 0, 10], up)))
  near(ratio(c, 60), 1.02, "not diluted by non-leap years")
  near(ratio(c, 61), 1, "Mar 1 flat")
})
test("yearly: turn of year captured (Jan 1 vs Dec 31 of the older year)", () => {
  const up = (d, p) => (d.getUTCMonth() == 0 && d.getUTCDate() == 1 ? p * 1.02 : p)
  const c = adr(yearly(series([2015, 0, 1], [2020, 3, 1], up)))
  near(ratio(c, 1), 1.02, "Jan 1 (oldest year has no prev -> left out)")
})
test("yearly: current (unfinished) year excluded", () => {
  const crash = (d, p) => (d.getUTCFullYear() == 2020 && d.getUTCMonth() == 1 && d.getUTCDate() == 3 ? p * 0.5 : p)
  const c = adr(yearly(series([2017, 0, 1], [2020, 2, 1], crash)))
  c.forEach((v) => near(v, 100, "flat"))
})
test("yearly: partial oldest year included, missing days give no samples", () => {
  // history starts Jul 1 2017; +4% on Jul 2 only in 2017, +0% in 2018/2019
  const up = (d, p) => (d.getUTCFullYear() == 2017 && d.getUTCMonth() == 6 && d.getUTCDate() == 2 ? p * 1.04 : p)
  const c = adr(yearly(series([2017, 6, 1], [2020, 0, 10], up)))
  const jul2 = 31 + 29 + 31 + 30 + 31 + 30 + 1 // normalized slot
  near(ratio(c, jul2 + 1), Math.exp(L(1.04) / 3), "3 samples: 2017, 2018, 2019")
  near(ratio(c, 2), 1, "Jan days: only 2018/2019, flat")
})

// ---------- monthly ----------
test("monthly: 32 points, turn of month incl. after Feb and 30-day months", () => {
  const up = (d, p) => (d.getUTCDate() == 1 ? p * 1.01 : p)
  const c = adr(monthly(series([2018, 0, 1], [2020, 5, 10], up)))
  assert.equal(c.length, 32)
  near(ratio(c, 1), 1.01, "day 1 of every month (no 1.0 dilution)")
  for (let i = 2; i <= 31; i++) near(ratio(c, i), 1, `day ${i} flat`)
})
test("monthly: day 31 averaged only over 31-day months", () => {
  const up = (d, p) => (d.getUTCDate() == 31 ? p * 1.03 : p)
  const c = adr(monthly(series([2018, 0, 1], [2020, 5, 10], up)))
  near(ratio(c, 31), 1.03, "day 31")
  near(ratio(c, 1), 1, "day 1 after a 31st")
})

// ---------- weekly ----------
test("weekly: 8 points, weekend carries close, change lands on Monday", () => {
  const up = (d, p) => (weekday(d) == 0 ? p * 1.01 : p) // Mon +1%, rest flat incl. weekend
  const c = adr(weekly(series([2019, 0, 7], [2020, 0, 8], up)))
  assert.equal(c.length, 8)
  near(ratio(c, 1), 1.01, "Monday vs previous Sunday")
  for (let i = 2; i <= 7; i++) near(ratio(c, i), 1, `weekday ${i - 1} flat`)
})
test("weekly: Friday move, weekend 0% days count as samples", () => {
  const up = (d, p) => (weekday(d) == 4 ? p * 1.02 : p)
  const c = adr(weekly(series([2019, 0, 7], [2020, 0, 8], up)))
  near(ratio(c, 5), 1.02, "Friday")
  near(ratio(c, 6), 1, "Saturday")
  near(ratio(c, 7), 1, "Sunday")
})


// ---------- chunk filter (cycles) ----------
test("filter: only included years, turn of year still against the real previous year", () => {
  // chunks newest first: 0 = 2020 (unfinished), 1 = 2019, 2 = 2018, 3 = 2017
  // Jan 1 jumps +10% in 2018 only, Dec 31 2017 drops -50%
  const f = (d, p) => {
    if (d.getUTCFullYear() == 2018 && d.getUTCMonth() == 0 && d.getUTCDate() == 1) return p * 1.1
    if (d.getUTCFullYear() == 2017 && d.getUTCMonth() == 11 && d.getUTCDate() == 31) return p * 0.5
    return p
  }
  const data = yearly(series([2017, 0, 1], [2020, 2, 1], f))
  const only2018 = calculateSeasonalityComposite(data, 0, (k) => k == 2)
  near(ratio(only2018, 1), 1.1, "Jan 1 2018 vs Dec 31 2017, not vs an excluded neighbour")
  near(ratio(only2018, 366), 1, "Dec 31 drop of 2017 not included")
  const all = calculateSeasonalityComposite(data, 0, () => true)
  assert.deepEqual(all, adr(data), "default = no filter")
  assert.equal(calculateSeasonalityComposite(data, 0, (k) => k == 0), null, "unfinished chunk 0 never counts")
  assert.equal(calculateSeasonalityComposite(data, 0, (k) => k == 9), null, "beyond history -> null")
})
