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

    /**
     * Taps the unit dropdown field to open it, then iterates ingrediente_form_unidad_*
     * items (resource-id pattern) to find the one matching unitName by text.
     * Unit IDs are database-generated and unknown at test time — ridPattern is the
     * only compliant way to enumerate the menu without hardcoding IDs.
     */
    private async selectUnit(unitName: string): Promise<void> {
        await this.tap(this.rid('ingrediente_form_campo_unidad'));
        const items = await $$(this.ridPattern('ingrediente_form_unidad_\\d+'));
        for (const item of items) {
            if ((await item.getText()) === unitName) {
                await item.click();
                return;
            }
        }
        throw new Error(`Unit "${unitName}" not found in dropdown`);
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
            await this.tap(this.rid('ingrediente_form_campo_tipo'));
            await this.tap(this.rid(`ingrediente_form_tipo_${supplierType}`));
        }

        await this.tap(this.rid('ingrediente_form_btn_guardar'));
        await this.waitForFormClosed();
    }

    async editIngredient(name: string, updates: Partial<Ingredient>): Promise<void> {
        const id = await this.findIngredienteId(name);
        await this.tap(this.rid(`ingredientes_item_${id}`));
        await this.waitForDisplayed(this.rid('ingrediente_form_campo_nombre'));

        if (updates.nombre !== undefined) {
            const campo = $(this.rid('ingrediente_form_campo_nombre'));
            await campo.clearValue();
            await campo.setValue(updates.nombre);
        }

        if (updates.unit !== undefined) {
            await this.selectUnit(updates.unit);
        }

        if (updates.supplierType !== undefined) {
            await this.tap(this.rid('ingrediente_form_campo_tipo'));
            await this.tap(this.rid(`ingrediente_form_tipo_${updates.supplierType}`));
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

    async getIngredientCount(): Promise<number> {
        return (await $$(this.ridPattern('ingredientes_item_\\d+'))).length;
    }
}

export default new IngredientesScreen();
