import seedBackup from '@data/fixtures/seed-backup.json';
import type { ChefPlannerBackup } from '@data/types';
import { resetAppState } from '@helpers/adb';
import { seedFromBackup } from '@helpers/seedFromBackup';
import GeneracionScreen from '@screens/GeneracionScreen';
import HistoricoScreen from '@screens/HistoricoScreen';
import HomeScreen from '@screens/HomeScreen';
import PedidoScreen from '@screens/PedidoScreen';

/** One ingredient to add to the order, with quantity and expected supplier group. */
export interface OrderItem {
    ingredientName: string;
    quantity: number;
    /** Supplier name as it appears in the GeneracionScreen group header (e.g. "Mercafresh"). */
    expectedSupplier: string;
}

/**
 * End-to-end flow for creating a confirmed order.
 *
 * Resets the app, seeds from backup, adds each ingredient to the current order,
 * adjusts quantities, generates the order, verifies supplier groups, confirms,
 * and asserts the confirmed order appears in Histórico.
 *
 * @param items - Ingredients to add, each with their expected quantity and supplier group.
 * @param backup - Backup to seed before the flow; defaults to the built-in seed fixture.
 * @throws if supplier groups don't match expectations or the confirmed order is absent from Histórico.
 */
export async function createOrderFlow(
    items: OrderItem[],
    backup: ChefPlannerBackup = seedBackup as ChefPlannerBackup,
): Promise<void> {
    await resetAppState();
    await seedFromBackup(backup);

    await HomeScreen.pedidoTab.click();
    await PedidoScreen.fabAgregar.waitForDisplayed({ timeout: 10000 });

    for (const item of items) {
        await PedidoScreen.addIngredientFromSearch(item.ingredientName);
    }

    for (const item of items) {
        await PedidoScreen.editItemQuantity(item.ingredientName, item.quantity);
    }

    await PedidoScreen.tapGenerateOrder();
    await GeneracionScreen.btnConfirmar.waitForDisplayed({ timeout: 10000 });
    await GeneracionScreen.cardTexto.waitForDisplayed({ timeout: 10000 });

    const actualGroups = (await GeneracionScreen.getSupplierGroups()).sort();
    const expectedGroups = [...new Set(items.map(i => i.expectedSupplier))].sort();

    if (JSON.stringify(actualGroups) !== JSON.stringify(expectedGroups)) {
        throw new Error(
            `Supplier groups mismatch.\n  Expected: ${expectedGroups.join(', ')}\n  Actual: ${actualGroups.join(', ')}`,
        );
    }

    await GeneracionScreen.confirmOrder();

    await HomeScreen.historicoTab.click();
    await browser.waitUntil(
        async () => (await HistoricoScreen.getOrderCount()) > 0,
        { timeout: 20_000, timeoutMsg: 'Confirmed order not found in Histórico' },
    );
}
