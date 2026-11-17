# Contributing

Thanks for helping improve the ChefPlanner UI tests. This guide covers the common changes. For setup and running tests, see the [README](README.md). For how elements are located, see [docs/selector-strategy.md](docs/selector-strategy.md).

## Ground rules

- **Layers:** specs → flows → screens. Each layer only calls the one below it. Selectors live only in `src/screens/`.
- **Naming:** domain nouns stay in Spanish, like the app (Pedido, Histórico, Proveedor); verbs are in English (`addIngredient`, `ProveedoresScreen`).
- **Imports:** use the path aliases `@screens/*`, `@flows/*`, `@helpers/*`, `@data/*` and `@config/*`.
- **Waits:** no `browser.pause`. Use `waitForDisplayed`, or `browser.waitUntil` with a `timeoutMsg`.
- **Independent tests:** a test must not rely on another test having run first. `@noReset` tests may build on what their own spec's `before()` set up.
- **Comments** explain *why*, usually a Compose or UiAutomator2 quirk, not what the code does.
- **Before opening a PR:** run `npx tsc --noEmit` (WebdriverIO doesn't type-check) and the suites you touched, on an emulator.

## Reporting a broken selector

A test fails with `element (...) still not displayed` or `no such element`, and the app looks fine on screen.

1. **Look at the failure screenshot** in `screenshots/` (in CI it's in the `screenshots` artifact, and the Allure report has it attached). Is the app on the expected screen? If not, the problem is navigation or timing, not the selector.
2. **Dump the screen** while the app shows the element:
   ```bash
   adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml > ui.xml
   grep -o 'resource-id="<screen>_[^"]*"' ui.xml
   ```
3. **Compare with the chefplanner source** (`grep -rn 'testTag = "<tag>"' app/src`).
4. **Open an issue** with the `bug` label that includes:
   - the failing test ID and spec file (e.g. `[R07]` in `catalogo.regression.spec.ts`)
   - the selector from the error message
   - what the dump shows instead (renamed tag, missing tag, element inside a popup...)
   - the screenshot, and the CI run link if it failed in CI

If the tag was renamed in the app, update the screen class. If it's missing, the fix belongs in the app: add the `testTag` there instead of falling back to a text selector.

## Adding a Screen Object

One class per app screen, in `src/screens/<Nombre>Screen.ts`:

```ts
import { BaseScreen } from './BaseScreen';

class UnidadesScreen extends BaseScreen {
    // Selectors: tags checked in a uiautomator dump, never guessed
    get fabAgregar() { return $(this.rid('unidades_fab_agregar')); }

    // Actions wait for their own result, so callers don't have to
    async addUnit(name: string): Promise<void> {
        await this.tap(this.rid('unidades_fab_agregar'));
        await this.waitForDisplayed(this.rid('unidades_dialog_nueva_campo_nombre'));
        await this.setValue(this.rid('unidades_dialog_nueva_campo_nombre'), name);
        await this.tap(this.rid('unidades_dialog_nueva_confirmar'));
        await this.waitForGone(this.rid('unidades_dialog_nueva_confirmar'));
    }
}

export default new UnidadesScreen();
```

- **Extend `BaseScreen`** and export a singleton (`export default new ...`).
- **Selectors:** use `this.rid('tag')`, or `this.ridPattern('regex')` for tags with IDs in them. Tags follow `<screen>_<element>_<name>`, and list rows are `<screen>_item_<id>`.
- **Use the `BaseScreen` helpers** (`tap`, `setValue`, `replaceValue`, `scrollToElement`, `tapUntilDisplayed`) instead of raw `$().click()`. They wait first.
- **Lists:** call `scrollToElement` before looking for a row, because `LazyColumn` only renders visible rows.
- **Text selectors:** only for the exceptions in the [selector strategy](docs/selector-strategy.md#when-text-selectors-are-allowed), with a comment saying why.

If the tags you need don't exist yet, add them to the app first.

## Adding a test to an existing suite

1. **Pick the suite:**
   - `smoke`: a critical happy path that should block every PR
   - `regression`: an edge case or validation rule
   - `e2e`: a long journey across several features
2. **Add an `it` to the spec for that feature,** or a new `<feature>.<suite>.spec.ts` in `src/specs/<suite>/`. Specs end in `.spec.ts` and contain no selectors.
3. **Seed data through a backup.** Build it with `buildBackup`, `buildIngredient` and `buildSupplier`, then load it with `seedFromBackup` or `restoreBackupFlow`. Only create data through the UI when that's what the test checks. An ingredient's `tipoProveedor` must match a supplier's `tipo`, or the app drops the supplier on import.
4. **Follow the conventions:**
   ```ts
   describe('[Smoke] Proveedores', () => {
       before(() => {
           AllureReporter.addSuite('Smoke');
           AllureReporter.addFeature('Proveedores');
       });

       it('[S08] should edit a supplier name', async () => {
           AllureReporter.addStory('Editar proveedor');
           // ...
       });
   });
   ```
   - IDs continue the suite's numbering: `[S..]` smoke, `[R..]` regression, `[E..]` e2e.
   - Describe blocks start with `[Smoke]`, `[Regression]` or `[E2E]`.
   - Allure `addSuite` and `addFeature` go in `before()`, `addStory` in each test.
5. **Remember the reset:** `beforeTest` runs `pm clear` before every test whose title doesn't contain `@noReset`. Seeding in `before()` only survives for `@noReset` tests.
6. **If several specs need the same steps,** put them in a flow in `src/flows/`. Flows wait for their outcome and throw a clear error if it doesn't happen.
7. **Run it locally,** and run it a few times if it involves navigation or timing:
   ```bash
   npx wdio run wdio.conf.ts --spec src/specs/<suite>/<file>.spec.ts
   ```

## Creating a new suite

1. **Folder:** `src/specs/<suite>/`.
2. **Config file:** `wdio.<suite>.conf.ts`, based on the existing ones:
   ```ts
   import { config as baseConfig } from './wdio.conf';

   export const config: WebdriverIO.Config = {
     ...baseConfig,
     specs: ['./src/specs/<suite>/**/*.spec.ts'],
   };
   ```
3. **Register it** in the `suites` map in `wdio.conf.ts`, and add `"test:<suite>": "wdio run wdio.<suite>.conf.ts"` to `package.json`.
4. **Decide where it runs in CI.** Either add `npm run test:<suite>` to an existing workflow's emulator step (see how E2E shares the regression job), or create a workflow modeled on `smoke.yml`. A new workflow should end with a `publish-report` job so its report reaches GitHub Pages.
5. **Document it** in the README's "Test suites" table.

## Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <summary>`, in the imperative and lower case, with no trailing period.

| Type | Use it for |
|---|---|
| `feat` | New framework capability: Screen Object, flow, builder, helper |
| `test` | New or changed tests (specs) |
| `fix` | Broken selector, flaky test, bug in framework code |
| `refactor` | Restructuring with no behavior change |
| `ci` | GitHub Actions workflows and CI scripts |
| `docs` | README, CONTRIBUTING, `docs/` |
| `chore` | Dependencies, config, tooling |

```
test: add weekly order E2E covering supplier rotation
fix: retry taps dropped right after a bottom-nav switch
ci: run the E2E suite in the regression workflow
```

Use the body to explain *why*, especially for Compose or UiAutomator workarounds. Reference issues with `Closes #<n>`.

## Branches and pull requests

- **One branch per change**, named `<type>/<short-description>` (e.g. `test/e2e-weekly-workflow`, `ci/allure-gh-pages`).
- **Open a PR into `main`.** Smoke and regression + E2E run on it, and the `regression` check must pass before merging. Branches are deleted automatically after merge.
- **In the PR description,** say what changed, why, and how you tested it (which suites, on what device). If you couldn't run the tests, say so.
