#!/usr/bin/env node
// Unit test runner
//   node testing/unittests/test.mjs                 -> all modules
//   node testing/unittests/test.mjs marketdatamodule -> only these modules
// Compiles all sources flat into .build/ (like the real build), then runs
// testing/unittests/<module>/*.test.mjs with node's built-in test runner.
// Tests import the compiled sources via "../.build/<file>.js".
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const here = path.dirname(new URL(import.meta.url).pathname)
const root = path.resolve(here, "../..")
const sourceDir = path.join(root, "sources/source")
const buildDir = path.join(here, ".build")

// ---------- build ----------
fs.rmSync(buildDir, { recursive: true, force: true })
fs.mkdirSync(buildDir)
const modules = fs.readdirSync(sourceDir).filter((m) => m != "allmodules")
const files = modules.flatMap((m) => {
    const dir = path.join(sourceDir, m)
    if (!fs.statSync(dir).isDirectory()) return []
    return fs.readdirSync(dir).map((f) => path.join(dir, f))
})
const coffeeFiles = files.filter((f) => f.endsWith(".coffee"))
execFileSync(path.join(root, "node_modules/.bin/coffee"), ["-o", buildDir + "/", "-c", ...coffeeFiles], { stdio: "inherit" })
for (const f of files.filter((f) => f.endsWith(".js"))) fs.copyFileSync(f, path.join(buildDir, path.basename(f)))
fs.symlinkSync(path.join(root, "node_modules"), path.join(buildDir, "node_modules"))
fs.writeFileSync(path.join(buildDir, "package.json"), '{"type":"module"}')

// ---------- select + run ----------
const testModules = fs.readdirSync(here).filter((d) => !d.startsWith(".") && fs.statSync(path.join(here, d)).isDirectory())
const selected = process.argv.slice(2)
for (const m of selected) if (!testModules.includes(m)) {
    console.error(`No tests for module "${m}" - available: ${testModules.join(", ")}`)
    process.exit(1)
}
const testFiles = (selected.length ? selected : testModules).flatMap((m) =>
    fs.readdirSync(path.join(here, m)).filter((f) => f.endsWith(".test.mjs")).map((f) => path.join(here, m, f)))

const result = spawnSync(process.execPath, ["--test", ...testFiles], { stdio: "inherit" })
process.exit(result.status)
