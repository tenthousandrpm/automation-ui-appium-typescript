import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient, buildSupplier } from '@data/builders';
import { createOrderFlow } from '@flows/createOrder.flow';

// tipoProveedor on the ingredient must match tipo on the supplier for the app
// to assign the ingredient to a supplier group during generation.
const backup = buildBackup({
    proveedores: [
        buildSupplier({ id: 1, nombre: 'Mercafresh',      tipo: 'Verduras' }),
        buildSupplier({ id: 2, nombre: 'Carnes Ibéricas', tipo: 'Carnes'   }),
    ],
    items: [
        buildIngredient({ id: 1, nombre: 'Tomate', unidadMedidaId: 1, tipoProveedor: 'Verduras' }),
        buildIngredient({ id: 2, nombre: 'Pollo',  unidadMedidaId: 1, tipoProveedor: 'Carnes'   }),
    ],
});

describe('[E2E] Create Order', () => {
    before(() => {
        AllureReporter.addSuite('E2E');
        AllureReporter.addFeature('Pedido');
        AllureReporter.addStory('Crear pedido completo');
    });

    it('[E01] should create a full order and confirm it to Histórico', async () => {
        await createOrderFlow(
            [
                { ingredientName: 'Tomate', quantity: 5,   expectedSupplier: 'Mercafresh'      },
                { ingredientName: 'Pollo',  quantity: 3.5, expectedSupplier: 'Carnes Ibéricas' },
            ],
            backup,
        );
    });
});
