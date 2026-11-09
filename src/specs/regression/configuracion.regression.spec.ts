import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient, buildSupplier } from '@data/builders';
import { exportBackupFlow } from '@flows/backup.flow';
import { resetAppState } from '@helpers/adb';
import { seedFromBackup } from '@helpers/seedFromBackup';
import ConfiguracionScreen from '@screens/ConfiguracionScreen';
import HomeScreen from '@screens/HomeScreen';

const backup = buildBackup({
    proveedores: [buildSupplier({ id: 1, nombre: 'Proveedor Config', tipo: 'Varios' })],
    items: [buildIngredient({ id: 1, nombre: 'Sal', unidadMedidaId: 1, tipoProveedor: 'Varios' })],
});

describe('[Regression] Configuración', () => {
    before(async () => {
        AllureReporter.addSuite('Regression');
        AllureReporter.addFeature('Configuración');
        await resetAppState();
        await seedFromBackup(backup);
        await HomeScreen.pedidoTab.click();
    });

    it('[R10] @regression @noReset should export a backup with valid JSON structure', async () => {
        AllureReporter.addStory('Exportar backup');
        const exported = await exportBackupFlow();

        if (!Number.isInteger(exported.version)) {
            throw new Error('Backup missing "version" integer field');
        }
        if (!Array.isArray(exported.items)) {
            throw new Error('Backup missing "items" array');
        }
        if (!Array.isArray(exported.proveedores)) {
            throw new Error('Backup missing "proveedores" array');
        }
        if (!Array.isArray(exported.unidadesMedida)) {
            throw new Error('Backup missing "unidadesMedida" array');
        }
        if (!exported.items.some(i => i.nombre === 'Sal')) {
            throw new Error('Seeded ingredient "Sal" not found in exported backup');
        }
        if (!exported.proveedores.some(p => p.nombre === 'Proveedor Config')) {
            throw new Error('Seeded supplier "Proveedor Config" not found in exported backup');
        }
    });

    it('[R11] @regression @noReset should reject an invalid backup without corrupting app data', async () => {
        AllureReporter.addStory('Importar backup inválido');
        const invalidPath = path.join(os.tmpdir(), `chefplanner_seed_invalid_${Date.now()}.json`);
        fs.writeFileSync(invalidPath, JSON.stringify({ version: 99, invalid: true }));

        let importSucceeded = false;
        try {
            await HomeScreen.configuracionTab.click();
            await ConfiguracionScreen.waitForDisplayed();
            await ConfiguracionScreen.importBackup(invalidPath);
            importSucceeded = true;
        } catch { /* expected — invalid backup should be rejected */ } finally {
            fs.unlinkSync(invalidPath);
        }

        if (importSucceeded) {
            throw new Error('Invalid backup was accepted — app should have rejected it');
        }
    });
});
