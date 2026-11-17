# automation-ui-appium-typescript

UI test automation for **ChefPlanner**, an Android Jetpack Compose app for planning a restaurant kitchen's weekly supplier orders.

[![Smoke](https://github.com/tenthousandrpm/automation-ui-appium-typescript/actions/workflows/smoke.yml/badge.svg?branch=main)](https://github.com/tenthousandrpm/automation-ui-appium-typescript/actions/workflows/smoke.yml?query=branch%3Amain)
[![Regression + E2E](https://github.com/tenthousandrpm/automation-ui-appium-typescript/actions/workflows/regression.yml/badge.svg?event=pull_request)](https://github.com/tenthousandrpm/automation-ui-appium-typescript/actions/workflows/regression.yml)
[![Allure report](https://img.shields.io/badge/Allure-latest%20reports-orange)](https://tenthousandrpm.github.io/automation-ui-appium-typescript/)

Every CI run publishes an Allure report to **[GitHub Pages](https://tenthousandrpm.github.io/automation-ui-appium-typescript/)**.

## Stack

| | Version |
|---|---|
| [Appium](https://appium.io/) + UiAutomator2 driver | 2.19 / 3.10 |
| [WebdriverIO](https://webdriver.io/) (Mocha runner) | 9.27 |
| TypeScript | 5.9 |
| Node.js | 22 (see `.nvmrc`) |
| [Allure](https://allurereport.org/) | 2.41 |
| CI | GitHub Actions + Android emulator (API 33) |

Appium and the driver are installed as dev dependencies, and WebdriverIO starts Appium for each run, so there's no global Appium install or server to manage.

## Framework architecture

```
src/
├── specs/          Test cases: describe/it, Allure labels, calls to flows
│   ├── smoke/
│   ├── regression/
│   └── e2e/
├── flows/          Multi-screen user journeys (create an order, restore a backup...)
├── screens/        One Screen Object per app screen; all selectors live here
├── data/           Types, builders and JSON fixtures for test data
├── helpers/        adb calls and backup seeding
└── config/         Environment variables (.env)
docs/
└── selector-strategy.md
scripts/
└── build-report-index.mjs   Builds the GitHub Pages report index
```

Each layer only calls the one below it: **specs → flows → screens**.

- **Screens** know *how* to interact with one screen: selectors, taps, waits, and the Compose quirks behind them. Each extends `BaseScreen` and exports a singleton.
- **Flows** describe *what* a user does across screens, such as "add these ingredients, generate the order, confirm it". A flow waits for its outcome and throws a clear error if it doesn't happen.
- **Specs** state *what must be true*. They set up data, call flows and assert results, with no selectors.

Test data is built with builders (`buildBackup`, `buildIngredient`, `buildSupplier`) and loaded through the app's own backup import, so each test starts from exactly the catalog it needs.

## Running locally

### Prerequisites

- **Node.js 22** (`nvm use` picks it up from `.nvmrc`)
- **Android SDK** with `platform-tools` and an emulator image. Set `ANDROID_HOME` (it defaults to `~/Android/Sdk`).
- **A Java runtime**, only needed to generate the Allure report
- **A ChefPlanner debug APK.** Download the latest `chefplanner-debug.apk` artifact from the chefplanner repo's `build-apk` workflow, or build it there with `./gradlew assembleDebug`. It has to be a *debug* build, because exporting backups reads the app's private storage with `adb run-as`, which Android only allows on debuggable apps.

### Setup

```bash
npm ci
cp .env.example .env                     # defaults work for a local emulator
cp <path-to>/chefplanner-debug.apk app/  # app/ is gitignored
```

### Run

```bash
emulator -avd <your-avd> -no-snapshot-save &   # boot an emulator (serial emulator-5554)

npm run test:smoke
npm run test:regression
npm run test:e2e

npx wdio run wdio.conf.ts --spec src/specs/e2e/weeklyOrder.e2e.spec.ts   # a single spec

npx tsc --noEmit    # type-check; WebdriverIO doesn't
npm run report      # build and open the Allure report
```

WebdriverIO installs the APK and starts Appium on port 4723 itself. Don't start another Appium server, and close Appium Inspector before running tests, because both use the same UiAutomator2 session.

## Test suites

| Suite | What it covers | Command | Local time |
|---|---|---|---|
| Smoke | Critical paths: launch, add ingredients to an order and confirm it, create catalog items, restore a backup | `npm run test:smoke` | ~1.5 min |
| Regression | Edge cases and validation: duplicates, zero quantities, deleting in-use units, invalid backups... | `npm run test:regression` | ~2 min |
| E2E | Full journeys, including two consecutive weekly orders that check supplier rotation and the exported backup | `npm run test:e2e` | ~1.5 min |

Test IDs are numbered per suite (`[S01]`, `[R01]`, `[E01]`) and every test carries Allure suite, feature and story labels.

## CI and the ChefPlanner app

The app and its tests live in separate repos. The APK moves between them as a CI artifact:

```
chefplanner (private)                     automation-ui-appium-typescript
─────────────────────                     ───────────────────────────────
build-apk workflow                        smoke / regression workflows
  ./gradlew assembleDebug                   download newest APK from chefplanner main
  upload chefplanner-debug.apk  ───────▶    boot Android emulator (API 33)
                                            run suites
                                            publish Allure report to GitHub Pages
```

- **Smoke** runs on every push to `main` and on every PR.
- **Regression + E2E** run on PRs to `main`. The `regression` check is required before merging.
- The APK download uses a fine-grained token (`CHEFPLANNER_ARTIFACTS_TOKEN`) with read access to chefplanner's Actions, because the default `GITHUB_TOKEN` can't read another repo's artifacts. Artifacts expire after 7 days. If none is left, the workflow fails with a message to re-run `build-apk`.
- Each run's report goes to `reports/<suite>-<run>/` on the `gh-pages` branch, and the index lists the last 10 runs.

## Design decisions

**WebdriverIO + Appium instead of Detox or Maestro.** Appium tests the real, unmodified APK from outside, the same way a user gets it. Detox needs the app built with its test library inside, and it's mainly aimed at React Native. Maestro's YAML flows are quick to write, but these tests lean on real code: building backup files, calling adb, and parsing the exported JSON to check supplier rotation. That's easier in TypeScript than in YAML with script hooks. WebdriverIO adds TypeScript, Mocha and first-class Allure support.

**Screen Objects plus a flow layer, not flat Page Objects.** In a flat Page Object design, multi-screen journeys get copied between specs or crammed into page classes. Here, screens own selectors and quirks, flows own journeys, and specs own assertions. When a selector changes, one screen class changes. When a journey changes, one flow changes.

**testTags first, no XPath.** Elements are found by Compose `testTag`s, exposed to UiAutomator as resource-ids. Text selectors are used only for documented exceptions, and XPath never. `contentDescription` (Appium's "accessibility id") is left for screen readers. See [docs/selector-strategy.md](docs/selector-strategy.md).

**adb `pm clear` instead of Appium's `fullReset`.** Before each test, `beforeTest` clears the app's data with `adb shell pm clear`, which takes about a second. `fullReset` would uninstall and reinstall the APK every time. Tests tagged `@noReset` keep the state created in their spec's `before()`, for checks that build on the same seeded data.

**Seeding through the app's backup import.** Tests build a backup in code and import it through the app's real import screen, instead of creating data through the UI or writing to the database. This is fast, needs no special access, and exercises a real feature. Data is created through the UI only when that's what the test is checking.

## Working on tests

### Appium Inspector

Use it to browse the element tree. Close it before running tests.

1. Start a server: `npx appium`
2. Connect to `http://localhost:4723` with these capabilities:
   ```json
   {
     "platformName": "Android",
     "appium:automationName": "UiAutomator2",
     "appium:deviceName": "emulator-5554",
     "appium:appPackage": "com.app.chefplanner",
     "appium:appActivity": ".MainActivity",
     "appium:noReset": true
   }
   ```
3. Click **Start Session**. A node's `resource-id` is its Compose `testTag` (e.g. `pedido_fab_agregar`).

For a quick check without Inspector: `adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml`.
