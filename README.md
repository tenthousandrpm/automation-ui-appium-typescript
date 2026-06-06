# automation-ui-appium-typescript
UI test automation suite for an Android app using Appium, WebdriverIO and Mocha

## Prerequisites

- Node.js + `npm install`
- Android SDK (`$ANDROID_HOME` set, `platform-tools` on PATH)
- Appium: `npm install -g appium && appium driver install uiautomator2`

## Running tests

**1. Start an emulator**
```bash
emulator -avd <avd-name>
emulator -avd Medium_Phone_API_36.1
```

**2. Install the app**
```bash
adb install app/chefplanner-debug.apk
```

**3. Run a suite** (Appium server starts automatically via wdio)
```bash
npm run test:smoke
npm run test:regression
npm run test:e2e
```

**Launch Appium server**
```bash
npx appium --port 4723
```

**View report**
```bash
npm run report
```

---

## Using Appium Inspector

> Do not run Inspector and the test suite on the same emulator at the same time — they both own the UiAutomator2 process and will kill each other.

**1. Start Appium server**
```bash
npx appium
```

**2. Open Appium Inspector, connect to `http://localhost:4723`, and use these capabilities:**
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

**3. Click Start Session.** The app launches and you can inspect elements. Use the tree panel to find `resource-id` values — they match the `testTag` names in the Compose source directly (e.g. `pedido_fab_agregar`).
