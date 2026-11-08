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
