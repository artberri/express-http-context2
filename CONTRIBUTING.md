# Contributing to `express-http-context2`

Help is welcome and much appreciated, whether you are an experienced developer or just looking for sending your first pull request. Please check the open issues. Be sure to follow the [Contributor Code of Conduct](./CODE_OF_CONDUCT.md).

## Guidelines

- Please fill in an issue before creating a Pull Request.
- Please try to [combine multiple commits before pushing](https://stackoverflow.com/questions/6934752/combining-multiple-commits-before-pushing-in-git)
- Please use `TDD` when fixing bugs. This means that you should write a unit test that fails because it reproduces the issue, then you should fix the issue and finally run the test to ensure that the issue has been resolved. This helps us prevent fixed bugs from happening again in the future.
- Please keep the test coverage at 100%. Write additional unit tests if necessary.
- Please commit using [Conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Setup

1. Fork of the repository

2. Clone your fork of the repository

   ```sh
   git clone https://github.com/YOUR_USERNAME/express-http-context2.git
   ```

3. Go to the project root folder

   ```sh
   cd express-http-context2
   ```

4. Configure git hooks

   ```sh
   git config core.hooksPath .githooks
   ```

5. Install the toolchain and dependencies. The Node.js and pnpm versions are
   pinned in `.prototools`; with [proto](https://moonrepo.dev/proto) installed,
   run:

   ```sh
   proto use
   pnpm install --frozen-lockfile
   ```

## Scripts

- `pnpm run qa`: check formatting (oxfmt), lint (oxlint), type-check and test.
  The pre-commit hook runs it.
- `pnpm run format`: format the code with oxfmt.
- `pnpm test`: run the tests with the Node.js test runner.
- `pnpm run test:coverage`: run the tests with coverage (writes `coverage/lcov.info`).
- `pnpm run build`: build the CommonJS and ESM bundles and types into `lib/` with tsdown.

## Releasing

1. Set the same `"version"` in `package.json` and `jsr.json`, and move the
   `Unreleased` entries in `CHANGELOG.md` under the new version.
2. Create a signed tag on that commit (`git tag -s vX.Y.Z -m "Version X.Y.Z"`),
   push it, and create a GitHub release from it. Creating the release runs
   `publish.yml`.
3. The `npm` job runs QA and the build, then stages the version on npm. It goes
   live only after a maintainer approves it with 2FA, on npmjs.com or with
   `npm stage approve <stage-id>` (`npm stage list express-http-context2` shows
   the id).
4. The `jsr` job runs after the `npm` job succeeds and publishes
   `@artberri/express-http-context2` immediately. JSR versions can't be deleted,
   only yanked, so don't re-run it after a partial publish.

Both registries authenticate through OIDC (trusted publishing), so the repo
holds no npm or JSR token.
