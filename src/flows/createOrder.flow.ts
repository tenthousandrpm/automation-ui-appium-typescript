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

/** Supplier name → item lines ("Tomate: 5 kg") as shown on GeneracionScreen before confirming. */
export type SupplierGroups = Record<string, string[]>;

export interface PlaceOrderOptions {
    /**
     * Number of confirmed orders Histórico must show once this one is confirmed.
     * Defaults to 1 (first order after a reset). Pass the running total when
     * confirming several orders in one test.
     */
    expectedHistoricoCount?: number;
}

/**
 * End-to-end flow for creating a confirmed order from a clean app.
 *
 * Resets the app, seeds from backup, then runs {@link placeOrderFlow}.
 *
 * @param items - Ingredients to add, each with their expected quantity and supplier group.
 * @param backup - Backup to seed before the flow; defaults to the built-in seed fixture.
 * @throws if supplier groups don't match expectations or the confirmed order is absent from Histórico.
 */
export async function createOrderFlow(
    items: OrderItem[],
    backup: ChefPlannerBackup = seedBackup as ChefPlannerBackup,
): Promise<SupplierGroups> {
    await resetAppState();
    await seedFromBackup(backup);
    return placeOrderFlow(items);
}

/**
 * Builds and confirms an order on the current app state (no reset, no seeding).
 *
 * Adds each ingredient to the current Pedido, sets quantities, generates the order,
 * verifies the supplier groups, confirms, and waits for Histórico to show the
 * expected number of confirmed orders.
 *
 * The Pedido must not already contain these ingredients: adding an existing one
 * increments its quantity instead of creating a row. Call {@link clearPedidoFlow} first
 * when the order still holds items from a previous confirmation.
 *
 * @returns the supplier groups shown on GeneracionScreen, so callers can compare orders.
 * @throws if supplier groups don't match expectations or Histórico never reaches the expected count.
 */
export async function placeOrderFlow(
    items: OrderItem[],
    { expectedHistoricoCount = 1 }: PlaceOrderOptions = {},
): Promise<SupplierGroups> {
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

    const groups = await GeneracionScreen.getSupplierGroupsWithItems();
    const actualGroups = Object.keys(groups).sort();
    const expectedGroups = [...new Set(items.map(i => i.expectedSupplier))].sort();

    if (JSON.stringify(actualGroups) !== JSON.stringify(expectedGroups)) {
        throw new Error(
            `Supplier groups mismatch.\n  Expected: ${expectedGroups.join(', ')}\n  Actual: ${actualGroups.join(', ')}`,
        );
    }

    await GeneracionScreen.confirmOrder();

    await HomeScreen.historicoTab.click();
    await browser.waitUntil(
        async () => (await HistoricoScreen.getOrderCount()) >= expectedHistoricoCount,
        {
            timeout: 20_000,
            timeoutMsg: `Histórico did not reach ${expectedHistoricoCount} confirmed order(s) after confirming`,
        },
    );

    return groups;
}

/**
 * Empties the current week's Pedido via the overflow menu.
 *
 * Confirming an order keeps its items in Pedido (the app only clears their supplier
 * assignment), so a second order in the same week starts by clearing them.
 */
export async function clearPedidoFlow(): Promise<void> {
    await HomeScreen.pedidoTab.click();
    await PedidoScreen.fabAgregar.waitForDisplayed({ timeout: 10000 });
    await PedidoScreen.clearOrder();

    await browser.waitUntil(
        async () => (await PedidoScreen.getOrderItemCount()) === 0,
        { timeout: 5_000, timeoutMsg: 'Pedido still has items after clearing it' },
    );
}
