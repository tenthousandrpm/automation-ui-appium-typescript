import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient, buildSupplier } from '@data/builders';
import { createIngredientFlow, createSupplierFlow } from '@flows/catalog.flow';
import { resetAppState } from '@helpers/adb';
import { seedFromBackup } from '@helpers/seedFromBackup';
import HomeScreen from '@screens/HomeScreen';

// Must include at least one item referencing the supplier tipo — the app only
// imports proveedores when there are items that cross-reference them.
const backup = buildBackup({
    proveedores: [buildSupplier({ id: 1, nombre: 'Proveedor Smoke', tipo: 'Varios' })],
    items: [buildIngredient({ id: 1, nombre: 'Tomate', unidadMedidaId: 1, tipoProveedor: 'Varios' })],
});

describe('[Smoke] Catálogo', () => {
    before(async () => {
        AllureReporter.addSuite('Smoke');
        AllureReporter.addFeature('Catálogo');
        await resetAppState();
        await seedFromBackup(backup);
        await HomeScreen.pedidoTab.click(); // leave Configuración so S05 navigates to Catálogo cleanly
    });

    it('[S05] @noReset should add an ingredient to the catalog', async () => {
        AllureReporter.addStory('Añadir ingrediente');
        await createIngredientFlow({ nombre: 'Mozzarella', unit: 'kg', supplierType: 'Varios' });
    });

    it('[S06] should add a supplier to the catalog', async () => {
        AllureReporter.addStory('Añadir proveedor');
        await createSupplierFlow({ nombre: 'Distribuidora Central', tipo: 'Distribución' });
    });
});
