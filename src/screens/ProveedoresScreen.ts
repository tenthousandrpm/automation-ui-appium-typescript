import { BaseScreen } from './BaseScreen';
import type { Supplier } from '@data/types';

export class ProveedoresScreen extends BaseScreen {
    get fabAgregar() { return $(this.rid('proveedores_fab_agregar')); }

    // --- Private helpers ---

    private async findProveedorId(name: string): Promise<string> {
        await this.scrollToElement(`android=new UiSelector().text("${name}")`);
        const rows = await $$(this.ridPattern('proveedores_item_\\d+'));
        for (const row of rows) {
            if ((await row.getText()).includes(name)) {
                const resourceId = await row.getAttribute('resource-id') ?? '';
                return resourceId.split('proveedores_item_')[1];
            }
        }
        throw new Error(`Supplier "${name}" not found`);
    }

    private async waitForFormClosed(): Promise<void> {
        await this.waitForGone(this.rid('proveedor_form_btn_guardar'));
    }

    // --- Public interface ---

    // The tipo field is a free-text editable OutlinedTextField (not a readonly dropdown),
    // so setValue is used directly instead of a dropdown interaction.
    async addSupplier(name: string, type: string): Promise<void> {
        await this.tap(this.rid('proveedores_fab_agregar'));
        await this.waitForDisplayed(this.rid('proveedor_form_campo_nombre'));

        await this.setValue(this.rid('proveedor_form_campo_nombre'), name);
        await this.setValue(this.rid('proveedor_form_campo_tipo'), type);

        await this.tap(this.rid('proveedor_form_btn_guardar'));
        await this.waitForFormClosed();
    }

    async editSupplier(name: string, updates: Partial<Supplier>): Promise<void> {
        const id = await this.findProveedorId(name);
        await this.tap(this.rid(`proveedores_item_${id}`));
        await this.waitForDisplayed(this.rid('proveedor_form_campo_nombre'));

        if (updates.nombre !== undefined) {
            const campo = $(this.rid('proveedor_form_campo_nombre'));
            await campo.clearValue();
            await campo.setValue(updates.nombre);
        }

        if (updates.tipo !== undefined) {
            const campo = $(this.rid('proveedor_form_campo_tipo'));
            await campo.clearValue();
            await campo.setValue(updates.tipo);
        }

        await this.tap(this.rid('proveedor_form_btn_guardar'));
        await this.waitForFormClosed();
    }

    async deleteSupplier(name: string): Promise<void> {
        const id = await this.findProveedorId(name);
        await this.tap(this.rid(`proveedores_btn_eliminar_${id}`));
        await this.waitForDisplayed(this.rid('proveedores_dialog_eliminar_confirmar'));
        await this.tap(this.rid('proveedores_dialog_eliminar_confirmar'));
        await this.waitForGone(this.rid('proveedores_dialog_eliminar_confirmar'));
    }

    async getSupplierCount(): Promise<number> {
        return (await $$(this.ridPattern('proveedores_item_\\d+'))).length;
    }
}

export default new ProveedoresScreen();
