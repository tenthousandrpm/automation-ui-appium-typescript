import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient } from '@data/builders';
import { resetAppState } from '@helpers/adb';
import { seedFromBackup } from '@helpers/seedFromBackup';
import HomeScreen from '@screens/HomeScreen';
import PedidoScreen from '@screens/PedidoScreen';

// Backup import persists items and units. Proveedores are NOT imported (app limitation).
// No pedidoItems — active order starts empty for predictable test state.
const backup = buildBackup({
    items: [
        buildIngredient({ id: 1, nombre: 'Tomate', unidadMedidaId: 1 }),
        buildIngredient({ id: 2, nombre: 'Pollo', unidadMedidaId: 1 }),
    ],
});

describe('[Regression] Pedido', () => {
    before(async () => {
        AllureReporter.addSuite('Regression');
        AllureReporter.addFeature('Pedido');
        await resetAppState();
        await seedFromBackup(backup);
        await HomeScreen.pedidoTab.click();
        await PedidoScreen.fabAgregar.waitForDisplayed({ timeout: 10_000 });
    });

    it('[R01] @regression @noReset should not add the same ingredient twice', async () => {
        AllureReporter.addStory('Ingrediente duplicado');
        await PedidoScreen.addIngredientFromSearch('Tomate');
        await browser.waitUntil(
            async () => (await PedidoScreen.getOrderItemCount()) === 1,
            { timeout: 5_000, timeoutMsg: 'Tomate not added to order on first attempt' },
        );
        await PedidoScreen.addIngredientFromSearch('Tomate');
        await browser.pause(1_000);
        const count = await PedidoScreen.getOrderItemCount();
        if (count !== 1) {
            throw new Error(`Duplicate ingredient allowed: expected 1 item but got ${count}`);
        }
    });

    it('[R02] @regression @noReset should remove item when quantity is set to zero', async () => {
        AllureReporter.addStory('Cantidad cero');
        const countBefore = await PedidoScreen.getOrderItemCount();
        await PedidoScreen.editItemQuantity('Tomate', 0);
        await browser.waitUntil(
            async () => (await PedidoScreen.getOrderItemCount()) === countBefore - 1,
            { timeout: 5_000, timeoutMsg: 'Item not removed when quantity set to zero' },
        );
    });

    it('[R03] @regression @noReset should show empty order after deleting all items', async () => {
        AllureReporter.addStory('Eliminar todos los items');
        await PedidoScreen.addIngredientFromSearch('Tomate');
        await PedidoScreen.addIngredientFromSearch('Pollo');
        await browser.waitUntil(
            async () => (await PedidoScreen.getOrderItemCount()) === 2,
            { timeout: 5_000, timeoutMsg: 'Two items not added to order' },
        );
        await PedidoScreen.deleteItem('Tomate');
        await PedidoScreen.deleteItem('Pollo');
        await browser.waitUntil(
            async () => (await PedidoScreen.getOrderItemCount()) === 0,
            { timeout: 5_000, timeoutMsg: 'Order not empty after deleting all items' },
        );
    });

    it('[R04] @regression @noReset should show no results for a nonexistent ingredient search', async () => {
        AllureReporter.addStory('Búsqueda sin resultados');
        await PedidoScreen.searchIngredient('IngredienteQueNoExiste');
        await browser.pause(1_000);
        const resultCount = await PedidoScreen.getPickerResultCount();
        await PedidoScreen.closePicker();
        if (resultCount !== 0) {
            throw new Error(`Expected 0 search results but found ${resultCount}`);
        }
    });
});
