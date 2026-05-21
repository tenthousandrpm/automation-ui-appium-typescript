import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { BaseScreen } from './BaseScreen';

const APP_PKG = 'com.app.chefplanner';
const DEVICE_DOWNLOAD = '/sdcard/Download';
const SNACKBAR_IMPORTADO_OK = 'Backup importado correctamente';

function adbBin(): string {
    const androidHome = process.env.ANDROID_HOME ?? path.join(process.env.HOME ?? '', 'Android', 'Sdk');
    return path.join(androidHome, 'platform-tools', 'adb');
}

function serial(): string {
    return process.env.DEVICE_NAME ?? 'emulator-5554';
}

class ConfiguracionScreen extends BaseScreen {

    override async waitForDisplayed(selector?: string, timeout?: number): Promise<void> {
        await super.waitForDisplayed(selector ?? this.rid('config_item_importar'), timeout);
    }

    /**
     * Taps export, dismisses the Android share sheet, then reads the backup JSON
     * from the app's private cache via `adb shell run-as` (requires a debug build).
     * Returns a local temp file path so callers can pass it directly to importBackup().
     *
     * The export target is context.cacheDir/backup/chefplanner_backup.json — it does
     * NOT go to Downloads; the share sheet is just a delivery mechanism for the user.
     */
    async exportBackup(): Promise<string> {
        await this.tap(this.rid('config_item_exportar'));
        await browser.pause(1_500);

        // Press Back to dismiss the share sheet; the file is already in app cache
        await browser.back();
        await browser.pause(500);

        const json = execFileSync(
            adbBin(),
            ['-s', serial(), 'shell', 'run-as', APP_PKG,
             'cat', 'cache/backup/chefplanner_backup.json'],
            { stdio: 'pipe' },
        ).toString();

        const localPath = path.join(os.tmpdir(), `chefplanner_export_${Date.now()}.json`);
        fs.writeFileSync(localPath, json);
        return localPath;
    }

    /**
     * Pushes filePath to Downloads on device, drives the full import flow
     * (file picker + confirm dialog), and waits for the success snackbar —
     * which is the signal that the DB transaction committed.
     * Assumes the Configuración screen is already active.
     */
    async importBackup(filePath: string): Promise<void> {
        const devicePath = `${DEVICE_DOWNLOAD}/${path.basename(filePath)}`;
        execFileSync(adbBin(), ['-s', serial(), 'push', filePath, devicePath], { stdio: 'pipe' });

        await this.tap(this.rid('config_item_importar'));
        await this._selectFileInSystemPicker(path.basename(filePath));
        await this.tap(this.rid('config_dialog_importar_confirmar'));

        // The dialog dismissal signals Trabajando; snackbar appearing signals ImportadoOk (DB done)
        await $(`android=new UiSelector().text("${SNACKBAR_IMPORTADO_OK}")`).waitForDisplayed({
            timeout: this.defaultTimeout,
        });
    }

    /**
     * Returns the installed app version via `adb shell dumpsys package`.
     * The version row in the UI has no testTag; the package manager is authoritative.
     */
    async getAppVersion(): Promise<string> {
        const output = execFileSync(
            adbBin(),
            ['-s', serial(), 'shell', 'dumpsys', 'package', APP_PKG],
            { stdio: 'pipe' },
        ).toString();
        const match = output.match(/versionName=([^\s\r\n]+)/);
        if (!match) throw new Error('getAppVersion: versionName not found in dumpsys output');
        return match[1];
    }

    /**
     * Returns true if the success snackbar is currently visible.
     * The snackbar is transient (~4 s). Since importBackup() returns as soon as
     * the snackbar appears, calling this immediately after importBackup() is reliable.
     */
    async isRestoreSuccessVisible(): Promise<boolean> {
        return $(`android=new UiSelector().text("${SNACKBAR_IMPORTADO_OK}")`).isExisting();
    }

    /**
     * Navigates the Android system file picker (Documents UI) to select a file
     * from the Downloads folder. The left-drawer "Downloads" shortcut is the most
     * stable entry point across Android versions.
     */
    private async _selectFileInSystemPicker(fileName: string): Promise<void> {
        await browser.pause(800);

        try {
            const drawer = $('android=new UiSelector().textContains("Downloads")');
            await drawer.waitForDisplayed({ timeout: 3_000 });
            await drawer.click();
            await browser.pause(400);
        } catch {
            // Drawer not visible — picker may already be showing Downloads
        }

        const baseName = path.parse(fileName).name;
        const entry = $(`android=new UiSelector().textContains("${baseName}")`);
        await entry.waitForDisplayed({ timeout: 5_000 });
        await entry.click();
    }
}

export default new ConfiguracionScreen();
