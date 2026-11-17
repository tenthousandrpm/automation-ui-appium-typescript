# CLAUDE.md

UI test framework for ChefPlanner, an Android Jetpack Compose app (`com.app.chefplanner`).
Stack: Appium 2 (UiAutomator2) + WebdriverIO 9 + Mocha + TypeScript, Allure reports.
App text and domain names are Spanish (Pedido, Histórico, Catálogo, Proveedor...). Keep that naming:
Spanish domain nouns, English verbs (e.g. `addIngredient`, `ProveedoresScreen`).

## Commands
- `npm run test:smoke` / `test:regression` / `test:e2e`
- One spec: `npx wdio run wdio.conf.ts --spec src/specs/smoke/pedido.smoke.spec.ts`
- Typecheck: `npx tsc --noEmit` (wdio does not type-check; run this after every change)
- Report: `npm run report`

Running tests needs a booted emulator (`emulator-5554`), the APK at `app/chefplanner-debug.apk`
(gitignored), and `ANDROID_HOME`. WDIO starts Appium itself, so never start another on port 4723.
Tests can't run while Appium Inspector is connected. If you couldn't run the tests, say so; don't claim a change works.

## Architecture
specs → flows → screens. Each layer only calls the one below it.
- `src/specs/` – describe/it, Allure labels, calls to flows. No selectors here.
- `src/flows/` – multi-screen user journeys. Wait on the outcome and throw a clear error on failure.
- `src/screens/` – one class per screen, extends `BaseScreen`, default-exports a singleton.
  All selectors live here.
- `src/data/` – types, builders (`buildBackup`, `buildIngredient`, `buildSupplier`), JSON fixtures.
- `src/helpers/` – adb calls, `seedFromBackup`.
- Use path aliases: `@screens/* @flows/* @helpers/* @data/* @config/*`.

## Locators
- Compose `testTag`s are exposed as bare resource-ids. Use `this.rid('tag')` and
  `this.ridPattern('regex')` from BaseScreen. Tag pattern: `<screen>_<element>_<name>`,
  list rows are `<screen>_item_<id>`.
- No XPath. Use text selectors only when no testTag exists (bottom nav, snackbars, Android system
  picker), with a comment saying why.
- Never guess a testTag. Check it in a uiautomator dump / Inspector, or ask me. If one is missing,
  suggest adding it to the app instead of writing a brittle selector.
- Lists are LazyColumn: only visible rows are in the tree. Call `scrollToElement` before looking
  for a row; `$$` counts only include visible rows.
- UiAutomator2 child searches don't stay inside the parent element. Use one chained UiSelector
  (`childSelector`) or match by position (see `PedidoScreen.findItemId`).
- Compose keeps screens alive after navigation (`saveState`), so old nodes stay in the tree.
  Don't `waitForGone` to confirm navigation; wait for something on the new screen.

## Waits
- No `browser.pause` in new code. Use `waitForDisplayed` or `browser.waitUntil` with a `timeoutMsg`.
- Default timeout is 10s (BaseScreen).

## Test data and app state
- Seed data by importing a backup: build it with the builders, then call `seedFromBackup`.
  Only create data through the UI when that's what the test is checking.
- An ingredient's `tipoProveedor` must match a supplier's `tipo`. Otherwise the app drops the
  supplier on import and won't group the ingredient.
- `beforeTest` in `wdio.conf.ts` runs `pm clear` before every test unless its title contains
  `@noReset`. Account for this when seeding in `before()`. This setup is intentional; don't
  change the reset behavior or the `@noReset` tags without asking.
- Keep tests independent; one test must not rely on another having run first.
- `exportBackup` uses `adb run-as`, so it needs a debug build.

## Conventions
- Test titles: `[S01]`-style IDs, numbered in order per suite; describe blocks start with `[Smoke]` / `[E2E]`.
- Allure: `addSuite`/`addFeature` in `before()`, `addStory` in each test.
- Conventional commits (`feat:`, `test:`, `fix:`, `refactor:`, `ci:`, `docs:`, `chore:`; see CONTRIBUTING.md), one feature branch per PR into main.
- Comments explain *why* (Compose/UiAutomator quirks), not what the code does.
