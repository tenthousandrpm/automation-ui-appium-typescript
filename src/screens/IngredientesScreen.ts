import { BaseScreen } from './BaseScreen';
import type { Ingredient } from '@data/types';

export class IngredientesScreen extends BaseScreen {
    get fabAgregar() { return $(this.rid('ingredientes_fab_agregar')); }

    // --- Private helpers ---

    private async findIngredienteId(name: string): Promise<string> {
        await this.scrollToElement(`android=new UiSelector().text("${name}")`);
        const rows = await $$(this.ridPattern('ingredientes_item_\\d+'));
        for (const row of rows) {
            if ((await row.getText()).includes(name)) {
                const resourceId = await row.getAttribute('resource-id') ?? '';
                return resourceId.split('ingredientes_item_')[1];
            }
        }
        throw new Error(`Ingredient "${name}" not found`);
    }

    private async selectUnit(unitName: string): Promise<void> {
        await this.tap(this.rid('ingrediente_form_campo_unidad'));
        const item = $(`android=new UiSelector().text("${unitName}")`);
        await item.waitForDisplayed({ timeout: 5_000 });
        await item.click();
    }

    private async selectTipo(tipoName: string): Promise<void> {
        await this.tap(this.rid('ingrediente_form_campo_tipo'));
        const item = $(`android=new UiSelector().text("${tipoName}")`);
        await item.waitForDisplayed({ timeout: 5_000 });
        await item.click();
    }

    private async waitForFormClosed(): Promise<void> {
        await this.waitForGone(this.rid('ingrediente_form_btn_guardar'));
    }

    // --- Public interface ---

    async addIngredient(name: string, unit: string, supplierType?: string): Promise<void> {
        await this.tap(this.rid('ingredientes_fab_agregar'));
        await this.waitForDisplayed(this.rid('ingrediente_form_campo_nombre'));

        await this.setValue(this.rid('ingrediente_form_campo_nombre'), name);
        await this.selectUnit(unit);

        if (supplierType !== undefined) {
            await this.selectTipo(supplierType);
        }

        await this.tap(this.rid('ingrediente_form_btn_guardar'));
        await this.waitForFormClosed();
    }

    async editIngredient(name: string, updates: Partial<Ingredient>): Promise<void> {
        const id = await this.findIngredienteId(name);
        await this.tap(this.rid(`ingredientes_item_${id}`));
        await this.waitForDisplayed(this.rid('ingrediente_form_campo_nombre'));

        if (updates.nombre !== undefined) {
            await this.replaceValue(this.rid('ingrediente_form_campo_nombre'), updates.nombre);
        }

        if (updates.unit !== undefined) {
            await this.selectUnit(updates.unit);
        }

        if (updates.supplierType !== undefined) {
            await this.selectTipo(updates.supplierType);
        }

        await this.tap(this.rid('ingrediente_form_btn_guardar'));
        await this.waitForFormClosed();
    }

    async deleteIngredient(name: string): Promise<void> {
        const id = await this.findIngredienteId(name);
        await this.tap(this.rid(`ingredientes_btn_eliminar_${id}`));
        await this.waitForDisplayed(this.rid('ingredientes_dialog_eliminar_confirmar'));
        await this.tap(this.rid('ingredientes_dialog_eliminar_confirmar'));
        await this.waitForGone(this.rid('ingredientes_dialog_eliminar_confirmar'));
    }

    /**
     * Opens the new-ingredient form, fills name and unit without selecting a supplier type,
     * then taps Guardar. Returns false if the form stayed open (validation fired — expected
     * for the "no supplier type" regression case); returns true if the form closed (saved).
     * Dismisses the form via Android back if it remained open.
     */
    async tryAddIngredientWithoutSupplierType(name: string, unit: string): Promise<boolean> {
        await this.tap(this.rid('ingredientes_fab_agregar'));
        await this.waitForDisplayed(this.rid('ingrediente_form_campo_nombre'));
        await this.setValue(this.rid('ingrediente_form_campo_nombre'), name);
        await this.selectUnit(unit);
        await this.tap(this.rid('ingrediente_form_btn_guardar'));
        await browser.pause(500);
        const formStillOpen = await $(this.rid('ingrediente_form_btn_guardar')).isDisplayed();
        if (formStillOpen) {
            await browser.back();
            await this.waitForGone(this.rid('ingrediente_form_btn_guardar'));
        }
        return !formStillOpen;
    }

    async getIngredientCount(): Promise<number> {
        return (await $$(this.ridPattern('ingredientes_item_\\d+'))).length;
    }

    async hasIngredient(name: string): Promise<boolean> {
        const items = await $$(this.ridPattern('ingredientes_item_\\d+'));
        for (const item of items) {
            if ((await item.getText()).includes(name)) return true;
        }
        return false;
    }
}

export default new IngredientesScreen();
