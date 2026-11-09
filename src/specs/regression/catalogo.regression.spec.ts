import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient } from '@data/builders';
import { createSupplierFlow, editSupplierFlow } from '@flows/catalog.flow';
import { resetAppState } from '@helpers/adb';
import { seedFromBackup } from '@helpers/seedFromBackup';
import CatalogoScreen from '@screens/CatalogoScreen';
import GeneracionScreen from '@screens/GeneracionScreen';
import HomeScreen from '@screens/HomeScreen';
import IngredientesScreen from '@screens/IngredientesScreen';
import PedidoScreen from '@screens/PedidoScreen';
import UnidadesScreen from '@screens/UnidadesScreen';

// Backup import persists items and units but NOT proveedores (app import limitation).
// tipoProveedor is set on items so order generation can group them by supplier tipo.
// unidadMedidaId:5 = botellas (from buildBackup defaults) is in use by Aceite de oliva for R06.
// R07 creates its supplier via UI before editing it.
const backup = buildBackup({
    items: [
        buildIngredient({ id: 1, nombre: 'Tomate', unidadMedidaId: 1, tipoProveedor: 'Verduras' }),
        buildIngredient({ id: 2, nombre: 'Pollo', unidadMedidaId: 1, tipoProveedor: 'Carnes' }),
        buildIngredient({ id: 3, nombre: 'Aceite de oliva', unidadMedidaId: 5, tipoProveedor: 'Aceites' }),
    ],
});

describe('[Regression] Catálogo', () => {
    before(async () => {
        AllureReporter.addSuite('Regression');
        AllureReporter.addFeature('Catálogo');
        await resetAppState();
        await seedFromBackup(backup);
        await HomeScreen.pedidoTab.click();
    });

    it('[R05] @regression @noReset should not save an ingredient when supplier type is missing', async () => {
        AllureReporter.addStory('Ingrediente sin proveedor');
        await HomeScreen.catalogoTab.click();
        await CatalogoScreen.navigateToIngredientes();
        const countBefore = await IngredientesScreen.getIngredientCount();
        const saved = await IngredientesScreen.tryAddIngredientWithoutSupplierType('Mozzarella', 'kg');
        if (saved) {
            throw new Error('Ingredient saved without supplier type — form validation not enforced');
        }
        const countAfter = await IngredientesScreen.getIngredientCount();
        if (countAfter > countBefore) {
            throw new Error('Ingredient count increased despite missing supplier type');
        }
    });

    it('[R06] @regression @noReset should prevent deleting a unit of measure that is in use', async () => {
        AllureReporter.addStory('Unidad de medida en uso');
        await HomeScreen.catalogoTab.click();
        await CatalogoScreen.navigateToUnidades();
        const countBefore = await UnidadesScreen.getUnitCount();
        if (await UnidadesScreen.isDeleteButtonVisible('botellas')) {
            try {
                await UnidadesScreen.deleteUnit('botellas');
            } catch { /* deletion correctly blocked by the app */ }
        }
        const stillExists = await UnidadesScreen.hasUnit('botellas');
        if (!stillExists) {
            throw new Error('Unit "botellas" was deleted despite being in use by "Aceite de oliva"');
        }
        const countAfter = await UnidadesScreen.getUnitCount();
        if (countAfter < countBefore) {
            throw new Error(`Unit count decreased from ${countBefore} to ${countAfter} — a unit was wrongly deleted`);
        }
    });

    it('[R07] @regression @noReset should reflect a supplier name change in the generated order', async () => {
        AllureReporter.addStory('Renombrar proveedor');
        // Backup import doesn't persist proveedores — create via UI then rename.
        await createSupplierFlow({ nombre: 'Mercafresh', tipo: 'Verduras' });
        await editSupplierFlow('Mercafresh', { nombre: 'Nuevo Proveedor' });

        // Add Tomate (tipoProveedor: Verduras → Nuevo Proveedor after rename) to have a generatable order.
        await HomeScreen.pedidoTab.click();
        await PedidoScreen.addIngredientFromSearch('Tomate');
        await PedidoScreen.btnGenerar.waitForDisplayed({ timeout: 10_000 });
        await PedidoScreen.tapGenerateOrder();
        await GeneracionScreen.btnConfirmar.waitForDisplayed({ timeout: 10_000 });

        const groups = await GeneracionScreen.getSupplierGroups();
        await GeneracionScreen.btnVolver.click();

        if (!groups.includes('Nuevo Proveedor')) {
            throw new Error(
                `Expected "Nuevo Proveedor" in supplier groups after rename, got: ${groups.join(', ')}`,
            );
        }
    });
});
