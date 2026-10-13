import { test } from "node:test"
import assert from "node:assert/strict"
import * as C from "../.build/cyclemath.js"

const T = "2026-10-12" // a Monday
const key = (u, d) => C.keyFromIdx(u, C.periodIdxOfDate(u, d))
const L = (rows) => rows.map((r) => r.cells.map((c) => c.label ?? "·"))
const st = (s) => C.applySetting({ name: "", ...s }, T)
const gridOf = (s, from, to) => L(C.buildGrid(s.unit, s.size, C.anchorIdxOf(s, T), from, to))

test("isValidYmd", () => {
    assert.equal(C.isValidYmd("2024-02-29"), true)
    for (const s of ["2023-02-29", "2026-13-01", "2026-1-01", "", null, 20260101]) assert.equal(C.isValidYmd(s), false)
})

test("period of a date, ISO weeks across year boundary", () => {
    assert.equal(C.periodIdxOfDate("years", T), 2026)
    assert.equal(key("quarters", T), "2026-Q4")
    assert.equal(key("months", T), "2026-10")
    assert.equal(key("weeks", "2026-10-14"), "2026-10-12")
    assert.equal(key("weeks", "2026-10-18"), "2026-10-12") // Sunday
    assert.equal(key("weeks", "2026-01-01"), "2025-12-29")
    assert.equal(key("weeks", "1970-01-01"), "1969-12-29") // before reference Monday
})

test("idxFromKey round-trips and rejects mismatches", () => {
    assert.equal(C.idxFromKey("quarters", "2026-Q1"), 2026 * 4)
    assert.equal(C.idxFromKey("months", "2026-01") - C.idxFromKey("months", "2025-12"), 1)
    assert.equal(C.idxFromKey("weeks", "2026-01-05") - C.idxFromKey("weeks", "2025-12-29"), 1)
    for (const [u, k] of [["quarters", "2026-03"], ["quarters", "2026-Q5"], ["months", "2026-13"],
        ["weeks", "2026-10-13"], ["years", "26"], ["years", 2026]]) assert.equal(C.idxFromKey(u, k), null, `${u} ${k}`)
})

test("labels", () => {
    assert.equal(C.labelFromIdx("years", 2026), "2026")
    assert.equal(C.labelFromIdx("quarters", C.idxFromKey("quarters", "2026-Q1")), "Q1.2026")
    assert.equal(C.labelFromIdx("months", C.idxFromKey("months", "2026-03")), "03.2026")
    assert.equal(C.labelFromIdx("weeks", C.idxFromKey("weeks", "2026-03-30")), "30.03.2026")
})

test("E1 4×years default anchor; empty cells keep key; cycle numbers", () => {
    const rows = C.buildGrid("years", 4, 2026, "2015-03-01", T)
    assert.deepEqual(L(rows), [["2026", "·", "·", "·"], ["2022", "2023", "2024", "2025"],
        ["2018", "2019", "2020", "2021"], ["·", "2015", "2016", "2017"]])
    assert.equal(rows[0].cells[1].key, "2027")
    assert.deepEqual(rows.map((r) => r.cycle), [0, -1, -2, -3])
})

test("E3 slider k=2 → anchor 2024", () => {
    const s = C.setSlider(st({ unit: "years", size: 4 }), 2)
    assert.equal(C.toSetting(s, T).anchor, "2024")
    assert.deepEqual(gridOf(s, "2015-03-01", T)[0], ["2024", "2025", "2026", "·"])
})

test("E4 anchor normalization, also for future anchors", () => {
    assert.equal(C.toSetting(st({ unit: "years", size: 4, anchor: "2018" }), T).anchor, "2026")
    const s = st({ unit: "years", size: 4, anchor: "2019" })
    assert.equal(s.k, 3)
    assert.equal(C.toSetting(s, T).anchor, "2023")
    assert.equal(C.toSetting(st({ unit: "years", size: 4, anchor: "2040" }), T).anchor, "2024")
})

test("E5 5×weeks, range starting mid-week", () => {
    assert.deepEqual(gridOf(st({ unit: "weeks", size: 5 }), "2026-08-20", T), [
        ["12.10.2026", "·", "·", "·", "·"],
        ["07.09.2026", "14.09.2026", "21.09.2026", "28.09.2026", "05.10.2026"],
        ["·", "·", "17.08.2026", "24.08.2026", "31.08.2026"]])
})

test("E6 12×months", () => {
    assert.equal(gridOf(st({ unit: "months", size: 12 }), "2025-01-01", T)[0][0], "10.2026")
})

test("range entirely in the past; size 1", () => {
    const rows = C.buildGrid("years", 4, 2026, "2010-01-01", "2013-12-31")
    assert.deepEqual(L(rows), [["2010", "2011", "2012", "2013"]])
    assert.equal(rows[0].cycle, -4)
    assert.deepEqual(L(C.buildGrid("years", 1, 2026, "2024-05-01", T)), [["2026"], ["2025"], ["2024"]])
})

test("E7 size change keeps position", () => {
    let s = st({ unit: "years", size: 5, anchor: "2023" })
    assert.equal(s.k, 3)
    s = C.commitSize(s, "3")
    assert.equal(s.k, 2)
    assert.deepEqual(C.toSetting(s, T), { name: "", unit: "years", size: 3, anchor: "2024", labels: ["", "", ""], included: [true, true, true] })
})

test("E8 unit change resets anchor, clamps size", () => {
    const s = C.setUnit(C.setSlider(st({ unit: "years", size: 4 }), 2), "quarters")
    assert.deepEqual(C.toSetting(s, T), { name: "", unit: "quarters", size: 4, anchor: "2026-Q4", labels: ["", "", "", ""], included: [true, true, true, true] })
    assert.equal(C.setUnit(st({ unit: "months", size: 30 }), "years").size, 20)
})

test("E9 empty start stays incomplete", () => {
    let s = C.emptyState()
    assert.equal(C.toSetting(s, T), null)
    s = C.setUnit(s, "months")
    assert.equal(s.size, null)
    assert.equal(C.toSetting(s, T), null)
    assert.equal(C.commitSize(s, "abc").size, null)
})

test("E12 size snapping", () => {
    const s = st({ unit: "months", size: 10 })
    assert.equal(C.commitSize(s, "500").size, 32)
    assert.equal(C.commitSize(s, "0").size, 1)
    assert.equal(C.commitSize(s, "abc").size, 10)
    assert.equal(C.commitSize(s, " ").size, 10)
    assert.equal(C.commitSize(s, "2.6").size, 3)
})

test("every edit switches to Benutzerdefiniert, keeps name + origin", () => {
    const s = C.applySetting({ name: "4 Jahre", unit: "years", size: 4 }, T)
    assert.deepEqual([s.presetName, s.origin, s.name], ["4 Jahre", "4 Jahre", "4 Jahre"])
    for (const e of [C.setSlider(s, 1), C.setUnit(s, "months"), C.commitSize(s, "5"), C.setLabel(s, 0, "x"), C.setIncluded(s, 0, false), C.setName(s, "4 J")]) {
        assert.equal(e.presetName, "")
        assert.equal(e.origin, "4 Jahre")
    }
    assert.equal(C.setSlider(s, 1).name, "4 Jahre")
    assert.equal(C.applySetting({ name: "Off", unit: "years", size: 4, official: true }, T).origin, "")
})

test("customDefault: default size per unit, all included, current period first", () => {
    assert.deepEqual(["years", "quarters", "months", "weeks"].map((u) => C.customDefault(u).size), [4, 4, 6, 7])
    assert.deepEqual(C.customDefault("months"), { ...C.emptyState(), unit: "months", size: 6, labels: ["", "", "", "", "", ""], included: [true, true, true, true, true, true] })
})

test("reverting all edits selects the preset again", () => {
    const s = C.applySetting({ name: "4 Jahre", unit: "years", size: 4, labels: ["a", "", "", "d"] }, T)
    assert.equal(C.setSlider(C.setSlider(s, s.k + 1), s.k).presetName, "4 Jahre")
    assert.equal(C.setLabel(C.setLabel(s, 0, "x"), 0, "a").presetName, "4 Jahre")
    assert.equal(C.setIncluded(C.setIncluded(s, 1, false), 1, true).presetName, "4 Jahre")
    assert.equal(C.setName(C.setName(s, "4"), "4 Jahre ").presetName, "4 Jahre") // trimmed
    assert.equal(C.commitSize(C.commitSize(s, "2"), "4").presetName, "") // labels lost on the way
    assert.equal(C.setSlider(C.customDefault("years"), 0).presetName, "") // no base after customDefault
})

test("labels follow size and unit", () => {
    let s = C.applySetting({ name: "", unit: "months", size: 3, labels: ["a", "b", "c"] }, T)
    assert.deepEqual(C.commitSize(s, "2").labels, ["a", "b"])
    assert.deepEqual(C.commitSize(s, "4").labels, ["a", "b", "c", ""])
    assert.deepEqual(C.setUnit(s, "weeks").labels, ["", "", ""])
    assert.deepEqual(C.setLabel(s, 1, "x").labels, ["a", "x", "c"])
    assert.deepEqual(s.labels, ["a", "b", "c"]) // not mutated
    assert.deepEqual(C.applySetting({ name: "", unit: "years", size: 2 }, T).labels, ["", ""])
    assert.deepEqual(C.emptyState().labels, [])
})

test("included follows size and unit, defaults to all", () => {
    let s = C.applySetting({ name: "", unit: "months", size: 3, included: [true, false, true] }, T)
    assert.deepEqual(C.commitSize(s, "2").included, [true, false])
    assert.deepEqual(C.commitSize(s, "4").included, [true, false, true, true])
    assert.deepEqual(C.setUnit(s, "weeks").included, [true, true, true])
    assert.deepEqual(C.setIncluded(s, 0, false).included, [false, false, true])
    assert.deepEqual(s.included, [true, false, true]) // not mutated
    assert.deepEqual(C.applySetting({ name: "", unit: "years", size: 2 }, T).included, [true, true]) // old presets
    assert.deepEqual(C.emptyState().included, [])
})

const official = { name: "US Wahlzyklus", unit: "years", size: 4, anchor: "2024", labels: ["W", "N", "M", "V"], official: true }
const mine = { name: "Mein", unit: "months", size: 3, anchor: "2026-01", labels: ["", "", ""] }
const presets = [official, mine]
const status = (s) => C.nameStatus(s, presets)

test("nameStatus: the button / warning table", () => {
    const off = C.applySetting(official, T)
    assert.deepEqual(status(off), { taken: false, canSave: false, canDelete: false }) // unchanged: nothing to save
    const own = C.applySetting(mine, T)
    assert.deepEqual(status(own), { taken: false, canSave: false, canDelete: true })
    assert.deepEqual(status(C.setSlider(off, 1)), { taken: true, canSave: false, canDelete: false }) // official name taken
    assert.deepEqual(status(C.setSlider(own, 1)), { taken: false, canSave: true, canDelete: true }) // own name overwrites, origin deletable
    assert.deepEqual(status(C.setName(own, " US Wahlzyklus ")), { taken: true, canSave: false, canDelete: true })
    const fresh = C.customDefault("months")
    assert.deepEqual(status(fresh), { taken: false, canSave: false, canDelete: false })
    assert.deepEqual(status(C.setName(fresh, "Mein")), { taken: true, canSave: false, canDelete: false }) // origin cleared
    assert.deepEqual(status(C.setName(fresh, "Neu")), { taken: false, canSave: true, canDelete: false })
    assert.equal(status(C.setName(C.emptyState(), "Neu")).canSave, false) // incomplete
    assert.equal(status(C.setName(C.emptyState(), "US Wahlzyklus")).taken, false) // incomplete: no warning
})

test("E11 savePreset: new, overwrite own, reject others", () => {
    const own = C.applySetting(mine, T)
    assert.deepEqual(C.savePreset(C.setName(own, "   "), presets, T), { reason: "empty" })
    assert.deepEqual(C.savePreset(C.setName(own, "US Wahlzyklus"), presets, T), { reason: "duplicate" })
    assert.deepEqual(C.savePreset(C.setName(C.emptyState(), "X"), presets, T), { reason: "incomplete" })
    assert.deepEqual(C.savePreset(C.setName(C.customDefault("months"), "Mein"), presets, T), { reason: "duplicate" })

    const r = C.savePreset(C.setLabel(own, 0, "Erster"), presets, T)
    assert.equal(r.presets.length, 2)
    assert.deepEqual(r.presets[1], { name: "Mein", unit: "months", size: 3, anchor: "2026-10", labels: ["Erster", "", ""], included: [true, true, true] })
    assert.deepEqual(status(r.state), { taken: false, canSave: false, canDelete: true })
    assert.equal(presets[1], mine) // input not mutated

    const n = C.savePreset(C.setName(own, " Neu "), presets, T)
    assert.deepEqual(n.presets.map((p) => p.name), ["US Wahlzyklus", "Mein", "Neu"])
    assert.deepEqual([n.state.presetName, n.state.origin, n.state.name], ["Neu", "Neu", "Neu"])
})

test("deletePreset keeps the values as unsaved Benutzerdefiniert", () => {
    assert.equal(C.deletePreset(C.applySetting(official, T), presets), null)
    const e = C.deletePreset(C.setSlider(C.applySetting(mine, T), 1), presets) // edited: origin still deletable
    assert.deepEqual([e.presets, e.state.origin, e.state.k], [[official], "", 1])
    const r = C.deletePreset(C.applySetting(mine, T), presets)
    assert.deepEqual(r.presets, [official])
    assert.deepEqual([r.state.presetName, r.state.origin, r.state.name, r.state.size], ["", "", "Mein", 3])
    assert.deepEqual(C.nameStatus(r.state, r.presets), { taken: false, canSave: true, canDelete: false })
})

test("isValidPreset", () => {
    assert.equal(C.isValidPreset({ name: "A", unit: "weeks", size: 32, anchor: "2026-10-12" }), true)
    assert.equal(C.isValidPreset({ name: "A", unit: "years", size: 4 }), true)
    assert.equal(C.isValidPreset({ name: "A", unit: "years", size: 2, labels: ["a", ""] }), true)
    assert.equal(C.isValidPreset({ name: "A", unit: "years", size: 2, included: [true, false] }), true)
    for (const p of [null, { name: " ", unit: "years", size: 4 }, { name: "A", unit: "days", size: 4 },
        { name: "A", unit: "years", size: 21 }, { name: "A", unit: "weeks", size: 33 }, { name: "A", unit: "years", size: 2.5 },
        { name: "A", unit: "quarters", size: 4, anchor: "2026-03" }, { name: "A", unit: "weeks", size: 5, anchor: "2026-10-13" },
        { name: "A", unit: "years", size: 2, labels: ["a"] }, { name: "A", unit: "years", size: 1, labels: [1] }, { name: "A", unit: "years", size: 1, labels: "a" },
        { name: "A", unit: "years", size: 2, included: [true] }, { name: "A", unit: "years", size: 1, included: ["true"] }])
        assert.equal(C.isValidPreset(p), false, JSON.stringify(p))
})

test("fixed presets normalize as expected", () => {
    const anchor = (s) => C.toSetting(C.applySetting({ name: "", ...s }, T), T).anchor
    assert.equal(anchor({ unit: "years", size: 4, anchor: "2024" }), "2024") // US Wahlzyklus
    assert.equal(anchor({ unit: "months", size: 12, anchor: "2026-01" }), "2026-01") // Monate im Jahr
    assert.equal(anchor({ unit: "months", size: 3, anchor: "2026-01" }), "2026-10") // Monate im Quartal
    assert.equal(anchor({ unit: "quarters", size: 4, anchor: "2026-Q1" }), "2026-Q1") // Quartale im Jahr (deferred, logic kept)
})

test("includedChunkFn maps chunk age to cycle position", () => {
    // 4×years, anchor 2024, only position 2 (2026, 2022, ...) included
    const years = { unit: "years", size: 4, anchor: "2024", included: [false, false, true, false] }
    const inc = C.includedChunkFn(years, "2026-10-12")
    assert.deepEqual([0, 1, 2, 3, 4, 5, 8].map(inc), [true, false, false, false, true, false, true])
    // refDate in an earlier period than today shifts the mapping
    assert.equal(C.includedChunkFn(years, "2025-12-31")(0), false)
    assert.equal(C.includedChunkFn(years, "2025-12-31")(3), true) // 2022
    // 12×months, Dec - Feb excluded, across the year boundary
    const months = { unit: "months", size: 12, anchor: "2026-01", included: [false, false, ...Array(9).fill(true), false] }
    const m = C.includedChunkFn(months, "2026-03-02")
    assert.deepEqual([0, 1, 2, 3, 4].map(m), [true, false, false, false, true]) // Mar, Feb, Jan, Dec, Nov
    // weeks: refDate on a Sunday belongs to the week of the Monday before
    const weeks = { unit: "weeks", size: 2, anchor: "2026-10-05", included: [true, false] }
    assert.deepEqual([0, 1, 2].map(C.includedChunkFn(weeks, "2026-10-18")), [false, true, false])
})

test("isFullCycle + displayAges: continuous vs. single", () => {
    const years = { unit: "years", size: 4, anchor: "2024", included: [false, false, true, false] }
    assert.equal(C.isFullCycle(years), false)
    assert.equal(C.isFullCycle({ ...years, included: [true, true, true, true] }), true)
    assert.deepEqual(C.displayAges(years, null), [1, 0])
    // 2026 is included -> the current period
    assert.deepEqual(C.displayAges(years, C.includedChunkFn(years, "2026-10-12")), [0])
    // 2027 is a year between -> last year's chunk
    assert.deepEqual(C.displayAges(years, C.includedChunkFn(years, "2027-03-01")), [1])
    // 2024 -> newest included is 2022
    assert.deepEqual(C.displayAges(years, C.includedChunkFn(years, "2024-03-01")), [2])
    const none = { ...years, included: [false, false, false, false] }
    assert.equal(C.displayAges(none, C.includedChunkFn(none, "2026-10-12")), null)
})
