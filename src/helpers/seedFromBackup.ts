import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { ChefPlannerBackup } from '@data/types';
import HomeScreen from '@screens/HomeScreen';
import ConfiguracionScreen from '@screens/ConfiguracionScreen';

/**
 * Seeds the app with the given backup — accepts either a local file path or a
 * ChefPlannerBackup object (written to a temp file automatically).
 *
 * Navigates to Configuración and delegates the full import flow (ADB push +
 * file picker + confirm dialog) to ConfiguracionScreen.importBackup().
 */
export async function seedFromBackup(source: string | ChefPlannerBackup): Promise<void> {
    let fixturePath: string;
    let tmpCreated = false;

    if (typeof source === 'string') {
        fixturePath = source;
    } else {
        fixturePath = path.join(os.tmpdir(), 'chefplanner_seed_import.json');
        fs.writeFileSync(fixturePath, JSON.stringify(source, null, 2));
        tmpCreated = true;
    }

    try {
        await HomeScreen.waitForDisplayed();
        await HomeScreen.configuracionTab.click();
        await ConfiguracionScreen.waitForDisplayed();

        await ConfiguracionScreen.importBackup(fixturePath);
    } finally {
        if (tmpCreated) fs.unlinkSync(fixturePath);
    }
}
