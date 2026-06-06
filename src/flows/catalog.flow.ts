import type { Ingredient, Supplier } from '@data/types';
import CatalogoScreen from '@screens/CatalogoScreen';
import HomeScreen from '@screens/HomeScreen';
import IngredientesScreen from '@screens/IngredientesScreen';
import ProveedoresScreen from '@screens/ProveedoresScreen';

export async function createIngredientFlow(ingredient: Ingredient): Promise<void> {
    await HomeScreen.catalogoTab.click();
    await CatalogoScreen.navigateToIngredientes();

    const countBefore = await IngredientesScreen.getIngredientCount();
    await IngredientesScreen.addIngredient(ingredient.nombre, ingredient.unit, ingredient.supplierType);

    await browser.waitUntil(
        async () => (await IngredientesScreen.getIngredientCount()) > countBefore,
        { timeout: 5000, timeoutMsg: `Ingredient "${ingredient.nombre}" not found after creation` },
    );
}

export async function editIngredientFlow(name: string, updates: Partial<Ingredient>): Promise<void> {
    await HomeScreen.catalogoTab.click();
    await CatalogoScreen.navigateToIngredientes();
    await IngredientesScreen.editIngredient(name, updates);

    if (updates.nombre !== undefined) {
        await browser.waitUntil(
            async () => IngredientesScreen.hasIngredient(updates.nombre!),
            { timeout: 5000, timeoutMsg: `Ingredient "${updates.nombre}" not visible after edit` },
        );
    }
}

export async function deleteIngredientFlow(name: string): Promise<void> {
    await HomeScreen.catalogoTab.click();
    await CatalogoScreen.navigateToIngredientes();

    const countBefore = await IngredientesScreen.getIngredientCount();
    await IngredientesScreen.deleteIngredient(name);

    await browser.waitUntil(
        async () => (await IngredientesScreen.getIngredientCount()) < countBefore,
        { timeout: 5000, timeoutMsg: `Ingredient "${name}" still present after deletion` },
    );
}

export async function createSupplierFlow(supplier: Supplier): Promise<void> {
    await HomeScreen.catalogoTab.click();
    await CatalogoScreen.navigateToProveedores();

    const countBefore = await ProveedoresScreen.getSupplierCount();
    await ProveedoresScreen.addSupplier(supplier.nombre, supplier.tipo);

    await browser.waitUntil(
        async () => (await ProveedoresScreen.getSupplierCount()) > countBefore,
        { timeout: 5000, timeoutMsg: `Supplier "${supplier.nombre}" not found after creation` },
    );
}
