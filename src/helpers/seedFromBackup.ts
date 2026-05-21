import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import type { ChefPlannerBackup } from '@data/types';
import HomeScreen from '@screens/HomeScreen';

const APP_PKG = 'com.app.chefplanner';
const DEVICE_SEED_PATH = '/sdcard/Download/chefplanner_seed.json';

function adbPath(): string {
    const androidHome = process.env.ANDROID_HOME ?? path.join(process.env.HOME ?? '', 'Android', 'Sdk');
    return path.join(androidHome, 'platform-tools', 'adb');
}

function deviceSerial(): string {
    return process.env.DEVICE_NAME ?? 'emulator-5554';
}

function resourceId(tag: string): string {
    return `android=new UiSelector().resourceId("${APP_PKG}:id/${tag}")`;
}

/**
 * Seeds the app with the given backup — accepts either a local file path or
 * a ChefPlannerBackup object (written to a temp file automatically).
 *
 * Navigates to Configuración, triggers the restore flow, handles the system
 * file picker, and confirms the import dialog.
 */
export async function seedFromBackup(source: string | ChefPlannerBackup): Promise<void> {
    let fixturePath: string;
    let tmpCreated = false;

    if (typeof source === 'string') {
        fixturePath = source;
    } else {
        fixturePath = path.join(os.tmpdir(), `chefplanner_seed_${Date.now()}.json`);
        fs.writeFileSync(fixturePath, JSON.stringify(source, null, 2));
        tmpCreated = true;
    }

    try {
        const adb = adbPath();
        const serial = deviceSerial();

        execFileSync(adb, ['-s', serial, 'push', fixturePath, DEVICE_SEED_PATH], { stdio: 'pipe' });

        await HomeScreen.waitForDisplayed();
        await HomeScreen.configuracionTab.click();

        const importItem = await $(resourceId('config_item_importar'));
        await importItem.waitForDisplayed({ timeout: 5_000 });
        await importItem.click();

        await _selectFileInSystemPicker('chefplanner_seed.json');

        const confirmBtn = await $(resourceId('config_dialog_importar_confirmar'));
        await confirmBtn.waitForDisplayed({ timeout: 5_000 });
        await confirmBtn.click();

        // Wait for the import transaction to complete and the UI to return to Idle
        await browser.pause(2_000);
    } finally {
        if (tmpCreated) fs.unlinkSync(fixturePath);
    }
}

/**
 * Navigates the Android system file picker (Documents UI) to select a file
 * from the Downloads folder.
 *
 * The picker UI varies slightly by Android version; the Downloads shortcut
 * in the left drawer is the most stable entry point.
 */
async function _selectFileInSystemPicker(fileName: string): Promise<void> {
    await browser.pause(800);

    try {
        const downloadsEntry = await $('android=new UiSelector().textContains("Downloads")');
        await downloadsEntry.waitForDisplayed({ timeout: 3_000 });
        await downloadsEntry.click();
        await browser.pause(400);
    } catch {
        // Drawer not visible — picker may already be showing Downloads
    }

    const baseName = path.parse(fileName).name;
    const fileEntry = await $(`android=new UiSelector().textContains("${baseName}")`);
    await fileEntry.waitForDisplayed({ timeout: 5_000 });
    await fileEntry.click();
}
