import { BaseScreen } from './BaseScreen';

export interface SupplierBlock {
    supplierName: string;
    items: string[];
}

export interface OrderDetail {
    blocks: SupplierBlock[];
}

export class HistoricoScreen extends BaseScreen {
    // --- Selectors ---

    get dialogEliminarConfirmar() { return $(this.rid('historico_dialog_eliminar_confirmar')); }
    get dialogEliminarCancelar() { return $(this.rid('historico_dialog_eliminar_cancelar')); }
    get detallebtnVolver() { return $(this.rid('detalle_btn_volver')); }

    // --- Private helpers ---

    /**
     * Scrolls the order with the given weekLabel into view, then walks all visible
     * historico_pedido_* rows to find the one whose text contains weekLabel.
     * Returns the numeric ID embedded in the resource-id (e.g. "historico_pedido_42" → "42").
     *
     * LazyColumn only renders visible rows — scrollToElement brings the target into
     * the accessibility tree before the $$ query.
     */
    private async findOrderId(weekLabel: string): Promise<string> {
        await this.scrollToElement(`android=new UiSelector().text("${weekLabel}")`);

        const rows = await $$(this.ridPattern('historico_pedido_\\d+'));
        for (const row of rows) {
            const text = await row.getText();
            if (text.includes(weekLabel)) {
                const resourceId = await row.getAttribute('resource-id') ?? '';
                return resourceId.split('historico_pedido_')[1];
            }
        }
        throw new Error(`Order with week label "${weekLabel}" not found`);
    }

    // --- Public interface ---

    /**
     * Returns the number of confirmed orders currently rendered in the list.
     * Off-screen rows in a long list may not be in the accessibility tree; scroll
     * to bottom first if a full count is needed.
     */
    async getOrderCount(): Promise<number> {
        const rows = await $$(this.ridPattern('historico_pedido_\\d+'));
        return rows.length;
    }

    /** Taps the order row matching weekLabel and waits for the detail screen to open. */
    async tapOrder(weekLabel: string): Promise<void> {
        const id = await this.findOrderId(weekLabel);
        await this.tap(this.rid(`historico_pedido_${id}`));
        await this.waitForDisplayed(this.rid('detalle_btn_volver'));
    }

    /**
     * Reads all detalle_bloque_* cards from the current detail screen and returns
     * them as typed SupplierBlock entries.
     *
     * Each card's getText() returns supplier name + item lines + button labels
     * ("Copiar", "Compartir"). Only lines that start with "-" are items.
     */
    async getOrderDetail(): Promise<OrderDetail> {
        const cards = await $$(this.ridPattern('detalle_bloque_.+'));
        const blocks: SupplierBlock[] = [];

        for (const card of cards) {
            const text = await card.getText();
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const supplierName = lines[0];
            const items = lines
                .slice(1)
                .filter(l => l.startsWith('-'))
                .map(l => l.replace(/^-\s*/, ''));
            blocks.push({ supplierName, items });
        }

        return { blocks };
    }

    /**
     * Deletes the first order in the list by its resource-id, without requiring a
     * known weekLabel. Useful in regression tests where the exact semana value is
     * unknown at test-write time.
     */
    async deleteFirstOrder(): Promise<void> {
        const rows = await $$(this.ridPattern('historico_pedido_\\d+'));
        const first = rows[0];
        if (!first) throw new Error('No orders found in Histórico');
        const resourceId = await first.getAttribute('resource-id') ?? '';
        const id = resourceId.split('historico_pedido_')[1];
        await this.tap(this.rid(`historico_btn_eliminar_${id}`));
        await this.waitForDisplayed(this.rid('historico_dialog_eliminar_confirmar'));
        await this.tap(this.rid('historico_dialog_eliminar_confirmar'));
        await this.waitForGone(this.rid('historico_dialog_eliminar_confirmar'));
    }

    /**
     * Taps the delete icon for the order matching weekLabel, then confirms the
     * AlertDialog that the app always shows before deleting.
     */
    async deleteOrder(weekLabel: string): Promise<void> {
        const id = await this.findOrderId(weekLabel);
        await this.tap(this.rid(`historico_btn_eliminar_${id}`));
        await this.waitForDisplayed(this.rid('historico_dialog_eliminar_confirmar'));
        await this.tap(this.rid('historico_dialog_eliminar_confirmar'));
        await this.waitForGone(this.rid('historico_dialog_eliminar_confirmar'));
    }

    /**
     * Returns true when no confirmed orders are present in the list.
     * The empty-state Text has no testTag, so absence of order rows is the only
     * compliant way to detect this state.
     */
    async isEmptyStateVisible(): Promise<boolean> {
        return (await this.getOrderCount()) === 0;
    }
}

export default new HistoricoScreen();
