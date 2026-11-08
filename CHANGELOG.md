# Changelog

All notable changes to `express-http-context2` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking:** require Node.js 22.12 or later.
- Build with tsdown. The package now ships `lib/index.mjs` and `lib/index.cjs`
  with matching `.d.mts`/`.d.cts` types, replacing `lib/esm`, `lib/cjs` and
  `lib/types`. Imports through the package entry point are unchanged.
- Tested against Express 4 and 5.

### Added

- Published on JSR as `@artberri/express-http-context2`.

### Fixed

- Share the context between all copies of the package loaded in a process
  (the CommonJS and ESM builds, or different versions required by an app and
  its dependencies), so a value set through one copy can be read through any
  other ([#1](https://github.com/artberri/express-http-context2/issues/1)).
- Keep the values already set when the middleware is mounted more than once for
  the same request, for example by the app and by a library.

## [1.0.0] - 2023-03-06

First stable version released after being tested in a production environment with intense traffic.

### Fixed

- Improved `README.md` file.
- Improved variable names in TS typings.

### Changed

- Upgrade dependencies: Eslint plugins and Node.js types.

## [0.0.1] - 2023-03-04

### Added

- First version.
