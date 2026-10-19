import { test } from "node:test"
import assert from "node:assert/strict"
import { bellFit, bellCount } from "../.build/chanceriskbell.js"

// deterministic standard normal samples (Box-Muller on a fixed LCG)
const normals = (n, center, sigma) => {
    let s = 42
    const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296 || 1e-12
    return Array.from({ length: n }, () => center + sigma * Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd()))
}
const sorted = (a) => [...a].sort((x, y) => x - y)

test("empty or no spread -> null", () => {
    assert.equal(bellFit([]), null)
    assert.equal(bellFit([0.01, 0.01, 0.01, 0.02, 0.5]), null)
})

test("recovers center and sigma of a normal sample", () => {
    const fit = bellFit(sorted(normals(20000, 0.01, 0.02)))
    assert.ok(Math.abs(fit.center - 0.01) < 0.001, `center ${fit.center}`)
    assert.ok(Math.abs(fit.sigma - 0.02) < 0.001, `sigma ${fit.sigma}`)
    for (const side of [fit.loss, fit.profit]) {
        assert.ok(Math.abs(side[0] - 0.68) < 0.02, `1σ share ${side[0]}`)
        assert.ok(Math.abs(side[1] - 0.95) < 0.01, `2σ share ${side[1]}`)
    }
})

test("outliers barely move the fit", () => {
    const clean = normals(5000, 0, 0.02)
    const fit = bellFit(sorted([...clean, ...Array(250).fill(0.5)]))
    assert.ok(Math.abs(fit.sigma - 0.02) < 0.002, `sigma ${fit.sigma}`)
    // the outliers sit on the right: beyond 3σ on the profit side for longs, the loss side for shorts
    assert.ok(fit.profit[2] < 0.95)
    assert.equal(bellFit(sorted([...clean, ...Array(250).fill(0.5)]), -1).loss[2], fit.profit[2])
})

test("curve area equals n", () => {
    const fit = { center: 0.01, sigma: 0.02 }
    const w = 0.001
    let area = 0
    for (let x = -0.2; x < 0.2; x += w) area += bellCount(fit, 500, w, x)
    assert.ok(Math.abs(area - 500) < 0.01, `area ${area}`)
})
