// chartlayout: axis per display mode, composite + latest placement
import { test } from "node:test"
import assert from "node:assert/strict"
import { periodPart, buildAxis, placeComposite, placeLatest } from "../.build/chartlayout.js"

const d = (y, m, day) => new Date(y, m - 1, day, 12)
const ymd = (ts) => { const t = new Date(ts * 1000); return [t.getFullYear(), t.getMonth() + 1, t.getDate()].join("-") }
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`)
// composite with N + 1 points from per-slot factors
const fromFactors = (factors) => factors.reduce((c, f) => [...c, c[c.length - 1] * f], [100])

test("periodPart: years, quarters, months, weeks", () => {
    assert.equal(periodPart("yearly", d(2025, 3, 1), 1).slots.length, 366) // 2024 leap
    assert.equal(periodPart("yearly", d(2025, 3, 1), 0).slots.length, 365)
    assert.equal(periodPart("yearly", d(2025, 3, 1), 0).slots[59], 60) // Mar 1 skips the FEB29 slot
    const q2 = periodPart("quarterly", d(2026, 5, 10), 0)
    assert.equal(q2.slots.length, 91) // Apr 30 + May 31 + Jun 30
    assert.deepEqual([q2.slots[29], q2.slots[30], q2.slots[61]], [29, 31, 62])
    assert.equal(ymd(q2.start.getTime() / 1000), "2026-4-1")
    const q4 = periodPart("quarterly", d(2026, 2, 10), 1)
    assert.equal(ymd(q4.start.getTime() / 1000), "2025-10-1")
    assert.equal(q4.slots.length, 92)
    assert.equal(ymd(periodPart("monthly", d(2026, 3, 15), 2).start.getTime() / 1000), "2026-1-1")
    assert.equal(periodPart("monthly", d(2026, 3, 15), 1).slots.length, 28)
    assert.equal(ymd(periodPart("weekly", d(2026, 10, 18), 0).start.getTime() / 1000), "2026-10-12") // Sunday
    assert.equal(ymd(periodPart("weekly", d(2026, 10, 18), 1).start.getTime() / 1000), "2026-10-5")
})

test("continuous yearly: front ends at 100, back continues, FEB29 only in the leap year", () => {
    const factors = Array(366).fill(1.001)
    factors[59] = 2 // FEB29 slot
    const axis = buildAxis("yearly", d(2025, 3, 1), [1, 0])
    assert.equal(axis.xAxisData.length, 366 + 365)
    assert.equal(axis.backStartIdx, 366)
    assert.equal(ymd(axis.xAxisData[366]), "2025-1-1")
    const adr = placeComposite(axis, fromFactors(factors))
    assert.equal(adr.length, 731)
    near(adr[365], 100, "front end")
    near(adr[366], 100.1, "back start")
    near(adr[59], adr[58] * 2, "FEB29 2024")
    near(adr[366 + 59], adr[366 + 58] * 1.001, "no FEB29 2025")
})

test("single: one part starting from 100", () => {
    const axis = buildAxis("monthly", d(2026, 3, 15), [2])
    assert.equal(axis.backStartIdx, 0)
    assert.equal(axis.xAxisData.length, 31)
    const adr = placeComposite(axis, fromFactors(Array(31).fill(1.01)))
    near(adr[0], 101, "first")
    assert.equal(adr.length, 31)
    const week = buildAxis("weekly", d(2026, 10, 14), [3])
    assert.equal(ymd(week.xAxisData[0]), "2026-9-21")
})

test("placeLatest: normalized to the last close before the last part, fallback first close", () => {
    const chunks = [[50, 60, undefined], [10, 20, null], [5, 8, 4], [2, 2, 2]]
    const weekish = (ages) => ({ ages, parts: ages.map(() => ({ slots: [0, 1, 2] })) })
    // continuous: ref = last number of chunk 1 = 20
    assert.deepEqual(placeLatest(weekish([1, 0]), chunks), [50, 100, null, 250, 300, null])
    // single [2]: ref = last of chunk 3 = 2
    assert.deepEqual(placeLatest(weekish([2]), chunks), [250, 400, 200])
    // single [3], no older chunk: ref = first close of chunk 3
    assert.deepEqual(placeLatest(weekish([3]), chunks), [100, 100, 100])
})
