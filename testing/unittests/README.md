# Unit tests

```sh
node testing/unittests/test.mjs                    # all modules
node testing/unittests/test.mjs marketdatamodule   # only selected modules
```

- `test.mjs` compiles all `sources/source/*/*.coffee` (+ plain `.js`) flat into `.build/`
  (gitignored), like the real build, then runs node's built-in test runner.
- Tests live in `<modulename>/*.test.mjs` and import compiled sources via
  `../.build/<file>.js`. Use `node:test` + `node:assert/strict`, no extra dependencies.
- Only pure logic is testable this way - modules touching the DOM or network at import
  time can't be loaded in node.
