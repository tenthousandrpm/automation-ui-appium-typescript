import { execFileSync } from 'child_process';
import path from 'path';

const APP_PACKAGE = 'com.app.chefplanner';

export async function resetAppState(): Promise<void> {
    const androidHome = process.env.ANDROID_HOME ?? path.join(process.env.HOME ?? '', 'Android', 'Sdk');
    const adbPath = path.join(androidHome, 'platform-tools', 'adb');
    const deviceSerial = process.env.DEVICE_NAME ?? 'emulator-5554';

    execFileSync(adbPath, ['-s', deviceSerial, 'shell', 'pm', 'clear', APP_PACKAGE], { stdio: 'pipe' });
    await browser.activateApp(APP_PACKAGE);
}
