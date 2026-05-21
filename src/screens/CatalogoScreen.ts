import { BaseScreen } from './BaseScreen';

class CatalogoScreen extends BaseScreen {
    get itemIngredientes() { return $(this.rid('catalogo_item_ingredientes')); }
    get itemProveedores() { return $(this.rid('catalogo_item_proveedores')); }
    get itemUnidades() { return $(this.rid('catalogo_item_unidades')); }

    async navigateToIngredientes(): Promise<void> {
        await this.tap(this.rid('catalogo_item_ingredientes'));
        await this.waitForDisplayed(this.rid('ingredientes_fab_agregar'));
    }

    async navigateToProveedores(): Promise<void> {
        await this.tap(this.rid('catalogo_item_proveedores'));
        await this.waitForDisplayed(this.rid('proveedores_fab_agregar'));
    }

    async navigateToUnidades(): Promise<void> {
        await this.tap(this.rid('catalogo_item_unidades'));
        await this.waitForDisplayed(this.rid('unidades_fab_agregar'));
    }
}

export default new CatalogoScreen();
