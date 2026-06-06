import AllureReporter from '@wdio/allure-reporter';
import seedBackup from '@data/fixtures/seed-backup.json';
import type { ChefPlannerBackup } from '@data/types';
import { resetAppState } from '@helpers/adb';
import { seedFromBackup } from '@helpers/seedFromBackup';
import HomeScreen from '@screens/HomeScreen';
import PedidoScreen from '@screens/PedidoScreen';

describe('[Smoke] Pedido', () => {
    before(async () => {
        AllureReporter.addSuite('Smoke');
        AllureReporter.addFeature('Pedido');
        await resetAppState();
        await seedFromBackup(seedBackup as ChefPlannerBackup);
        await HomeScreen.pedidoTab.click();
        await PedidoScreen.fabAgregar.waitForDisplayed({ timeout: 10_000 });
    });

    it('[S01] @noReset should launch and display the Pedido screen', async () => {
        AllureReporter.addStory('App launch');
        await PedidoScreen.fabAgregar.waitForDisplayed({ timeout: 5_000 });
    });

    it('[S02] @noReset should search for an ingredient and add it to the order', async () => {
        AllureReporter.addStory('Buscar y añadir ingrediente');
        await PedidoScreen.addIngredientFromSearch('Tomate');
        await browser.waitUntil(
            async () => (await PedidoScreen.getOrderItemCount()) > 0,
            { timeout: 5_000, timeoutMsg: 'Ingredient not added to order' },
        );
    });
});
