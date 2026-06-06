import { BaseScreen } from './BaseScreen';

// testTagsAsResourceId = true in Compose exposes testTag values as bare resource-ids
// (no package prefix). Verified via Appium Inspector uiautomator dump.
export class PedidoScreen extends BaseScreen {
    // --- Selectors ---

    get fabAgregar() { return $(this.rid('pedido_fab_agregar')); }
    get btnGenerar() { return $(this.rid('pedido_btn_generar')); }

    // IngredientePicker dialog
    get pickerCampoBuscar() { return $(this.rid('picker_campo_buscar')); }
    get pickerBtnCerrar() { return $(this.rid('picker_btn_cerrar')); }

    // CantidadDialog
    get dialogCantidadCampo() { return $(this.rid('pedido_dialog_cantidad_campo')); }
    get dialogCantidadConfirmar() { return $(this.rid('pedido_dialog_cantidad_confirmar')); }
    get dialogCantidadCancelar() { return $(this.rid('pedido_dialog_cantidad_cancelar')); }

    // --- Private helpers ---

    /**
     * Scrolls the named item into view, then iterates visible pedido_item_row_* elements
     * to find the one whose accessible text contains itemName. Returns the numeric item ID
     * embedded in the resource-id (e.g. "pedido_item_row_42" → "42").
     *
     * NOTE: LazyColumn only renders visible items. scrollToElement ensures the target
     * row is in the accessibility tree before the $$ query.
     */
    private async findItemId(itemName: string): Promise<string> {
        await this.scrollToElement(`android=new UiSelector().text("${itemName}")`);

        // Compose container nodes return "" for getText(), and UiAutomator2 child
        // element searches fall back to a global match rather than scoping within the
        // element's subtree. Use spatial overlap instead: find the text element on
        // screen and return the row whose Y bounds contain it.
        const nameEl = $(`android=new UiSelector().text("${itemName}")`);
        await nameEl.waitForDisplayed({ timeout: this.defaultTimeout });
        const { y: nameY } = await nameEl.getLocation();

        const rows = await $$(this.ridPattern('pedido_item_row_\\d+'));
        for (const row of rows) {
            const { y: rowY } = await row.getLocation();
            const { height: rowH } = await row.getSize();
            if (nameY >= rowY && nameY <= rowY + rowH) {
                const resourceId = await row.getAttribute('resource-id') ?? '';
                return resourceId.split('pedido_item_row_')[1];
            }
        }
        throw new Error(`Order item "${itemName}" not found in list`);
    }

    // --- Public interface ---

    /**
     * Opens the ingredient picker and types in the search field.
     * Leaves the picker open so the caller can act on results.
     */
    async searchIngredient(name: string): Promise<void> {
        await this.tap(this.rid('pedido_fab_agregar'));
        await this.waitForDisplayed(this.rid('picker_campo_buscar'));
        await this.setValue(this.rid('picker_campo_buscar'), name);
    }

    /**
     * Searches for an ingredient by exact name and taps it to add it to the order.
     * Hides the keyboard first to clear any floating toolbar tooltip that would intercept
     * the tap. After typing, the picker filters results live — waits for the first
     * picker_ingrediente_<id> row to appear and clicks it. The ListItem container carries
     * the clickable handler; the inner text nodes do not. Waits for the picker to close
     * before returning so the next call can safely tap the FAB.
     */
    async addIngredientFromSearch(name: string): Promise<void> {
        await this.searchIngredient(name);
        await browser.hideKeyboard();

        const firstRow = $(this.ridPattern('picker_ingrediente_\\d+'));
        await firstRow.waitForDisplayed({ timeout: 5_000 });
        await firstRow.click();
        await this.waitForGone(this.rid('picker_campo_buscar'));
    }

    /**
     * Returns the number of items currently rendered in the order list.
     * Counts pedido_item_row_* nodes in the accessibility tree. Off-screen items
     * in a large LazyColumn may not be included; scroll to bottom first if a full
     * count is needed.
     */
    async getOrderItemCount(): Promise<number> {
        const rows = await $$(this.ridPattern('pedido_item_row_\\d+'));
        return rows.length;
    }

    /**
     * Taps the quantity display for the named item, enters a new value in the dialog,
     * and confirms. Accepts integer or decimal values (e.g. 2, 1.5).
     */
    async editItemQuantity(itemName: string, quantity: number): Promise<void> {
        const id = await this.findItemId(itemName);

        await this.tap(this.rid(`pedido_cantidad_${id}`));
        await this.waitForDisplayed(this.rid('pedido_dialog_cantidad_campo'));

        const campo = this.dialogCantidadCampo;
        await campo.clearValue();
        await campo.setValue(String(quantity));

        await this.tap(this.rid('pedido_dialog_cantidad_confirmar'));
    }

    /**
     * Swipes the named item left to trigger SwipeToDismissBox deletion (threshold 40%).
     * Uses mobile: swipeGesture with 75% travel on the pedido_item_* container.
     */
    async deleteItem(itemName: string): Promise<void> {
        const id = await this.findItemId(itemName);

        const swipeTarget = $(this.rid(`pedido_item_${id}`));
        await swipeTarget.waitForDisplayed({ timeout: this.defaultTimeout });

        const { x, y } = await swipeTarget.getLocation();
        const { width, height } = await swipeTarget.getSize();

        await browser.execute('mobile: swipeGesture', {
            left: x,
            top: y,
            width,
            height,
            direction: 'left',
            percent: 0.75,
        });
    }

    /** Taps the "Generar pedido" button. Only visible when the order has at least one item. */
    async tapGenerateOrder(): Promise<void> {
        await this.tap(this.rid('pedido_btn_generar'));
    }
}

export default new PedidoScreen();
