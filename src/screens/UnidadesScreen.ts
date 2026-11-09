import { BaseScreen } from './BaseScreen';

export class UnidadesScreen extends BaseScreen {
    get fabAgregar() { return $(this.rid('unidades_fab_agregar')); }

    // --- Private helpers ---

    // Compose container nodes return "" for getText() so we use spatial overlap
    // (same pattern as PedidoScreen.findItemId) to locate the row by position.
    private async findUnidadId(name: string): Promise<string> {
        await this.scrollToElement(`android=new UiSelector().text("${name}")`);

        const nameEl = $(`android=new UiSelector().text("${name}")`);
        await nameEl.waitForDisplayed({ timeout: this.defaultTimeout });
        const { y: nameY } = await nameEl.getLocation();

        const rows = await $$(this.ridPattern('unidades_item_\\d+'));
        for (const row of rows) {
            const { y: rowY } = await row.getLocation();
            const { height: rowH } = await row.getSize();
            if (nameY >= rowY && nameY <= rowY + rowH) {
                const resourceId = await row.getAttribute('resource-id') ?? '';
                return resourceId.split('unidades_item_')[1];
            }
        }
        throw new Error(`Unit "${name}" not found`);
    }

    // --- Public interface ---

    async addUnit(name: string): Promise<void> {
        await this.tap(this.rid('unidades_fab_agregar'));
        await this.waitForDisplayed(this.rid('unidades_dialog_nueva_campo_nombre'));
        await this.setValue(this.rid('unidades_dialog_nueva_campo_nombre'), name);
        await this.tap(this.rid('unidades_dialog_nueva_confirmar'));
        await this.waitForGone(this.rid('unidades_dialog_nueva_confirmar'));
    }

    async deleteUnit(name: string): Promise<void> {
        const id = await this.findUnidadId(name);
        await this.tap(this.rid(`unidades_btn_eliminar_${id}`));
        await this.waitForDisplayed(this.rid('unidades_dialog_eliminar_confirmar'));
        await this.tap(this.rid('unidades_dialog_eliminar_confirmar'));
        await this.waitForGone(this.rid('unidades_dialog_eliminar_confirmar'));
    }

    async getUnitCount(): Promise<number> {
        return (await $$(this.ridPattern('unidades_item_\\d+'))).length;
    }

    async hasUnit(name: string): Promise<boolean> {
        try {
            await this.scrollToElement(`android=new UiSelector().text("${name}")`);
            return $(`android=new UiSelector().text("${name}")`).isDisplayed();
        } catch {
            return false;
        }
    }

    async isDeleteButtonVisible(name: string): Promise<boolean> {
        const id = await this.findUnidadId(name);
        return $(this.rid(`unidades_btn_eliminar_${id}`)).isExisting();
    }

    /**
     * Default units (esPredeterminada = true) render a Lock icon instead of a delete
     * button. Absence of unidades_btn_eliminar_<id> is the signal — no testTag on the
     * lock icon itself.
     */
    async getDefaultUnits(): Promise<string[]> {
        const rows = await $$(this.ridPattern('unidades_item_\\d+'));
        const defaults: string[] = [];
        for (const row of rows) {
            const resourceId = await row.getAttribute('resource-id') ?? '';
            const id = resourceId.split('unidades_item_')[1];
            if (!(await $(this.rid(`unidades_btn_eliminar_${id}`)).isExisting())) {
                defaults.push((await row.getText()).split('\n')[0].trim());
            }
        }
        return defaults;
    }
}

export default new UnidadesScreen();
