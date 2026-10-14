import { test } from "node:test"
import assert from "node:assert/strict"
import { simulate } from "../.build/tradesimulationmodule.js"

// seq: day 0 = entry close, then [high, low, close] per day ([close] = non-trading day)
const run = (entryDate, seq, extra = {}) => ({ tradable: true, entryDate, exitDate: "x-" + entryDate, seq: [[seq[0]], ...seq.slice(1)], ...extra })
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)

const longSummary = {
    isLong: true,
    runInfoObjects: [ // newest first, like the backtester delivers them
        run("2022-01-03", [100, [104, 99, 103], [111, 102, 110]]),        // +10%, high +11%, low -1%
        run("2021-01-04", [100, [101, 90, 95], [96, 94, 95]]),            // -5%, low -10%
        run("2020-01-02", [100, [102, 97, 101], [101], [106, 100, 104]]), // +4%, non-trading day inside
        { tradable: false },
        run("2019-01-02", [100, [300, 99, 300]], { warn: true }),
    ],
}

test("no controls: every trade runs to its exit, oldest first, warn and untradable excluded", () => {
    const { trades, equity, stats } = simulate(longSummary)
    assert.deepEqual(trades.map((t) => t.entryDate), ["2020-01-02", "2021-01-04", "2022-01-03"])
    near(trades[0].profitF, 0.04)
    near(trades[1].profitF, -0.05)
    near(trades[1].maxDropF, -0.10)
    near(trades[2].maxRiseF, 0.11)
    assert.equal(trades[2].exit, "end")
    assert.equal(trades[2].exitDate, "x-2022-01-03")
    assert.deepEqual(equity.map((e) => +e.toFixed(9)), [100, 104, 99, 109])
    near(stats.sumProfitF, 0.09)
    assert.deepEqual([stats.total, stats.wins, stats.losses, stats.slHits, stats.tpHits], [3, 2, 1, 0, 0])
})

test("reinvest compounds", () => {
    const { equity } = simulate(longSummary, { reinvest: true })
    near(equity[3], 100 * 1.04 * 0.95 * 1.10)
})

test("drawdowns: mark-to-market sees the intra-trade low, realized only closed trades", () => {
    const { stats } = simulate(longSummary)
    // peak 104 after trade 1, trough in trade 2: 104 - 10 = 94
    near(stats.maxDrawdownF, 94 / 104 - 1)
    near(stats.maxDrawdownRealizedF, 99 / 104 - 1)
    near(stats.maxDrawdownAbs, -10)
    near(stats.maxDrawdownRealizedAbs, -5)
})

test("stop-loss fills at the level, or at the day's best price when the whole day is beyond it", () => {
    const { trades, stats } = simulate(longSummary, { stopLossF: -0.05 })
    near(trades[1].profitF, -0.05)
    assert.equal(trades[1].exit, "sl")
    assert.equal(trades[1].exitDate, "2021-01-05")
    near(trades[1].maxDropF, -0.05)
    assert.equal(stats.slHits, 1)

    const gap = simulate({ isLong: true, runInfoObjects: [run("2020-01-02", [100, [93, 90, 92]])] }, { stopLossF: -0.05 })
    near(gap.trades[0].profitF, -0.07)
})

test("take-profit fills at its level; stop-loss wins on a day hitting both", () => {
    const { trades, stats } = simulate(longSummary, { takeProfitF: 0.07 })
    near(trades[2].profitF, 0.07)
    assert.equal(trades[2].exitDate, "2022-01-05")
    assert.equal(stats.tpHits, 1)

    const both = simulate({ isLong: true, runInfoObjects: [run("2020-01-02", [100, [106, 94, 100]])] }, { stopLossF: -0.05, takeProfitF: 0.05 })
    assert.equal(both.trades[0].exit, "sl")
})

test("short trades: profit on falling prices, stop-loss above entry", () => {
    const summary = { isLong: false, runInfoObjects: [run("2020-01-02", [100, [103, 97, 98], [108, 99, 107]])] }
    near(simulate(summary).trades[0].profitF, -0.07)
    near(simulate(summary).trades[0].maxRiseF, 0.03)
    const { trades } = simulate(summary, { stopLossF: -0.05 })
    near(trades[0].profitF, -0.05)
    assert.equal(trades[0].exit, "sl")
})

test("fees are deducted per round trip", () => {
    const { trades, stats } = simulate(longSummary, { feeF: 0.01 })
    near(trades[0].profitF, 0.03)
    near(stats.sumProfitF, 0.06)
})
