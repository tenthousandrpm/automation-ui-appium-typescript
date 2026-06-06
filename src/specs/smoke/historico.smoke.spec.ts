import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient, buildSupplier } from '@data/builders';
import { createOrderFlow } from '@flows/createOrder.flow';
import HomeScreen from '@screens/HomeScreen';
import HistoricoScreen from '@screens/HistoricoScreen';

const backup = buildBackup({
    proveedores: [buildSupplier({ id: 1, nombre: 'Mercafresh', tipo: 'Verduras' })],
    items: [buildIngredient({ id: 1, nombre: 'Tomate', unidadMedidaId: 1, tipoProveedor: 'Verduras' })],
});

describe('[Smoke] Histórico', () => {
    before(() => {
        AllureReporter.addSuite('Smoke');
        AllureReporter.addFeature('Histórico');
    });

    it('[S03] should generate and confirm an order', async () => {
        AllureReporter.addStory('Generar y confirmar pedido');
        await createOrderFlow(
            [{ ingredientName: 'Tomate', quantity: 3, expectedSupplier: 'Mercafresh' }],
            backup,
        );
    });

    it('[S04] @noReset confirmed order should appear in Histórico', async () => {
        AllureReporter.addStory('Pedido confirmado en Histórico');
        // Navigate away and back to verify the order persisted in storage
        await HomeScreen.pedidoTab.click();
        await HomeScreen.historicoTab.click();
        await browser.waitUntil(
            async () => (await HistoricoScreen.getOrderCount()) > 0,
            { timeout: 5_000, timeoutMsg: 'No confirmed orders found in Histórico after navigation' },
        );
    });
});
