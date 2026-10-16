import { test } from "node:test"
import assert from "node:assert/strict"
import { binProfile } from "../.build/chanceriskbins.js"

const trade = (closes, profitF = closes[closes.length - 1]) => ({ profitF, path: closes.map((c) => [c, c]) })
const sum = (a) => a.reduce((s, v) => s + v, 0)

// deterministic pseudo-random spread around 0
const spread = (n, scale) => Array.from({ length: n }, (_, i) => scale * Math.sin(i * 12.9898) * Math.cos(i * 4.1414))

test("no trade-days -> null", () => {
    assert.equal(binProfile([]), null)
    assert.equal(binProfile([trade([], 0)]), null)
})

test("every day counted once, split by the trade's result", () => {
    const trades = [trade(spread(300, 0.05), 0.02), trade(spread(200, 0.03), -0.01), trade(spread(100, 0.04), 0)]
    const { edges, losses, wins } = binProfile(trades)
    assert.equal(sum(wins), 300)
    assert.equal(sum(losses), 300) // profitF 0 counts as loss
    assert.equal(edges.length, wins.length + 1)
})

test("bin count within 10..100, 0 is an edge, width is a nice step", () => {
    for (const [n, scale] of [[20, 0.01], [600, 0.05], [5000, 0.2], [50000, 0.02]]) {
        const { edges } = binProfile([trade(spread(n, scale))])
        const count = edges.length - 1
        assert.ok(count >= 10 && count <= 100, `${count} bins for n=${n}`)
        const w = edges[1] - edges[0]
        const zeroAt = -edges[0] / w
        assert.ok(Math.abs(zeroAt - Math.round(zeroAt)) < 1e-6, "0 is an edge")
        const mantissa = +(w / 10 ** Math.floor(Math.log10(w) + 1e-9)).toFixed(6)
        assert.ok([1, 2, 2.5, 5].includes(mantissa), `nice width ${w}`)
    }
})

test("no clipping: the range covers min and max", () => {
    const { edges, losses } = binProfile([trade([...spread(500, 0.02), 0.5, -0.5], -0.01)])
    assert.ok(edges[0] <= -0.5 && edges[edges.length - 1] >= 0.5)
    assert.ok(losses[0] >= 1 && losses[losses.length - 1] >= 1)
})

test("all values equal: still a valid layout", () => {
    const { edges, wins } = binProfile([trade([0.01, 0.01, 0.01])])
    assert.ok(edges.length - 1 >= 10)
    assert.equal(sum(wins), 3)
})

test("sign -1 (short): price change instead of profit, colour still by profit", () => {
    // short trade with +3% profit = price fell 3%
    const { edges, wins } = binProfile([trade([0.03, 0.03, 0.03])], -1)
    const i = wins.findIndex((c) => c > 0)
    assert.ok(edges[i + 1] <= 0, "profit of a short sits left of 0")
    assert.equal(sum(wins), 3)
})

test("offset: the choices are nice widths within 10..100 bins, coarse to fine, 0 stays an edge", () => {
    const trades = [trade(spread(600, 0.05))]
    const auto = binProfile(trades)
    const width = (p) => p.edges[1] - p.edges[0]
    const { choices } = auto
    assert.ok(choices.length > 1)
    assert.ok(choices.some((c) => c.offset == 0 && Math.abs(c.width - width(auto)) < 1e-12))
    for (let i = 1; i < choices.length; i++) assert.ok(choices[i].width < choices[i - 1].width, "coarse to fine")
    for (const c of choices) {
        const p = binProfile(trades, 1, c.offset)
        assert.equal(p.edges.length - 1, c.count)
        assert.ok(c.count >= 10 && c.count <= 100, `${c.count} bins`)
        assert.ok(Math.abs(width(p) - c.width) < 1e-12)
        const zeroAt = -p.edges[0] / width(p)
        assert.ok(Math.abs(zeroAt - Math.round(zeroAt)) < 1e-6, "0 is an edge")
    }
    // not a choice (stale offset) -> the FD width
    assert.deepEqual(binProfile(trades, 1, 50).edges, auto.edges)
})
