import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient, buildSupplier } from '@data/builders';
import { createOrderFlow } from '@flows/createOrder.flow';
import HistoricoScreen from '@screens/HistoricoScreen';

const backup = buildBackup({
    proveedores: [buildSupplier({ id: 1, nombre: 'Mercafresh', tipo: 'Verduras' })],
    items: [buildIngredient({ id: 1, nombre: 'Tomate', unidadMedidaId: 1, tipoProveedor: 'Verduras' })],
});

describe('[Regression] Histórico', () => {
    before(() => {
        AllureReporter.addSuite('Regression');
        AllureReporter.addFeature('Histórico');
    });

    it('[R08] @regression should delete a confirmed order from Histórico', async () => {
        AllureReporter.addStory('Eliminar pedido del histórico');
        await createOrderFlow(
            [{ ingredientName: 'Tomate', quantity: 2, expectedSupplier: 'Mercafresh' }],
            backup,
        );
        // createOrderFlow ends on the Histórico tab with at least one confirmed order
        await browser.waitUntil(
            async () => (await HistoricoScreen.getOrderCount()) > 0,
            { timeout: 5_000, timeoutMsg: 'No confirmed orders found before deletion attempt' },
        );
        await HistoricoScreen.deleteFirstOrder();
        await browser.waitUntil(
            async () => (await HistoricoScreen.getOrderCount()) === 0,
            { timeout: 5_000, timeoutMsg: 'Order still present in Histórico after deletion' },
        );
    });

    it('[R09] @regression @noReset should show empty state in Histórico when no orders exist', async () => {
        AllureReporter.addStory('Estado vacío en Histórico');
        // After R08 the order was deleted — Histórico is already on screen with 0 orders
        const isEmpty = await HistoricoScreen.isEmptyStateVisible();
        if (!isEmpty) {
            throw new Error('Expected Histórico empty state but orders are still visible');
        }
    });
});
