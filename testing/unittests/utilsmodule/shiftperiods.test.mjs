import { test } from "node:test"
import assert from "node:assert/strict"
import { shiftPeriodsBack } from "../.build/utilsmodule.js"

const d = (y, m, day) => new Date(y, m - 1, day, 12)
const iso = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-")

test("weekly shifts by 7 days, across month and year", () => {
    assert.equal(iso(shiftPeriodsBack(d(2026, 10, 9), 1, "weekly")), "2026-10-2")
    assert.equal(iso(shiftPeriodsBack(d(2026, 1, 2), 1, "weekly")), "2025-12-26")
    assert.equal(iso(shiftPeriodsBack(d(2026, 10, 9), 0, "weekly")), "2026-10-9")
})

test("monthly clamps missing days to the month end", () => {
    assert.equal(iso(shiftPeriodsBack(d(2026, 10, 31), 1, "monthly")), "2026-9-30")
    assert.equal(iso(shiftPeriodsBack(d(2026, 3, 31), 1, "monthly")), "2026-2-28")
    assert.equal(iso(shiftPeriodsBack(d(2026, 3, 30), 25, "monthly")), "2024-2-29")
    assert.equal(iso(shiftPeriodsBack(d(2026, 1, 15), 1, "monthly")), "2025-12-15")
})

test("yearly maps Feb 29 to Feb 28 in non-leap years", () => {
    assert.equal(iso(shiftPeriodsBack(d(2024, 2, 29), 1, "yearly")), "2023-2-28")
    assert.equal(iso(shiftPeriodsBack(d(2024, 2, 29), 4, "yearly")), "2020-2-29")
    assert.equal(iso(shiftPeriodsBack(d(2026, 12, 31), 5, "yearly")), "2021-12-31")
})

test("quarterly shifts by 3 months, clamped to the month end", () => {
    assert.equal(iso(shiftPeriodsBack(d(2026, 5, 31), 1, "quarterly")), "2026-2-28")
    assert.equal(iso(shiftPeriodsBack(d(2026, 2, 10), 1, "quarterly")), "2025-11-10")
    assert.equal(iso(shiftPeriodsBack(d(2026, 2, 10), 4, "quarterly")), "2025-2-10")
})
