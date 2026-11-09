import * as fs from 'fs';
import type { ChefPlannerBackup } from '@data/types';
import { seedFromBackup } from '@helpers/seedFromBackup';
import CatalogoScreen from '@screens/CatalogoScreen';
import ConfiguracionScreen from '@screens/ConfiguracionScreen';
import HomeScreen from '@screens/HomeScreen';
import IngredientesScreen from '@screens/IngredientesScreen';

export async function restoreBackupFlow(source: string | ChefPlannerBackup): Promise<void> {
    await seedFromBackup(source);

    await HomeScreen.catalogoTab.click();
    await CatalogoScreen.navigateToIngredientes();

    await browser.waitUntil(
        async () => (await IngredientesScreen.getIngredientCount()) > 0,
        { timeout: 10_000, timeoutMsg: 'No ingredients found after backup restore' },
    );
}

export async function exportBackupFlow(): Promise<ChefPlannerBackup> {
    await HomeScreen.waitForDisplayed();
    await HomeScreen.configuracionTab.click();
    await ConfiguracionScreen.waitForDisplayed();

    const localPath = await ConfiguracionScreen.exportBackup();
    const raw = fs.readFileSync(localPath, 'utf-8');
    fs.unlinkSync(localPath);

    const backup = JSON.parse(raw) as ChefPlannerBackup;

    if (!Array.isArray(backup.items) || !Array.isArray(backup.proveedores)) {
        throw new Error('exportBackupFlow: backup is missing required arrays');
    }

    return backup;
}
