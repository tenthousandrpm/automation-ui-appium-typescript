import AllureReporter from '@wdio/allure-reporter';
import { buildBackup, buildIngredient, buildSupplier } from '@data/builders';
import { exportBackupFlow, restoreBackupFlow } from '@flows/backup.flow';
import { clearPedidoFlow, placeOrderFlow, type OrderItem } from '@flows/createOrder.flow';

// Rotation picks, per supplier type, the supplier whose last confirmed use is oldest;
// never-used suppliers come first, and ties fall back to the catalog's name order.
// "Huerta del Valle" sorts before "Mercafresh", so it wins week 1 and must lose week 2.
// Carnes has a single supplier, which checks that rotation never drops a type.
const HUERTA = buildSupplier({ id: 1, nombre: 'Huerta del Valle', tipo: 'Verduras' });
const MERCAFRESH = buildSupplier({ id: 2, nombre: 'Mercafresh', tipo: 'Verduras' });
const CARNES = buildSupplier({ id: 3, nombre: 'Carnes Ibéricas', tipo: 'Carnes' });

const catalogo = buildBackup({
    proveedores: [HUERTA, MERCAFRESH, CARNES],
    items: [
        buildIngredient({ id: 1, nombre: 'Tomate',  unidadMedidaId: 1, tipoProveedor: 'Verduras' }),
        buildIngredient({ id: 2, nombre: 'Cebolla', unidadMedidaId: 1, tipoProveedor: 'Verduras' }),
        buildIngredient({ id: 3, nombre: 'Lechuga', unidadMedidaId: 3, tipoProveedor: 'Verduras' }),
        buildIngredient({ id: 4, nombre: 'Pollo',   unidadMedidaId: 1, tipoProveedor: 'Carnes'   }),
        buildIngredient({ id: 5, nombre: 'Ternera', unidadMedidaId: 1, tipoProveedor: 'Carnes'   }),
    ],
});

function weeklyOrder(verdurasSupplier: string, quantities: [number, number, number, number]): OrderItem[] {
    const [tomate, cebolla, pollo, ternera] = quantities;
    return [
        { ingredientName: 'Tomate',  quantity: tomate,  expectedSupplier: verdurasSupplier },
        { ingredientName: 'Cebolla', quantity: cebolla, expectedSupplier: verdurasSupplier },
        { ingredientName: 'Pollo',   quantity: pollo,   expectedSupplier: CARNES.nombre    },
        { ingredientName: 'Ternera', quantity: ternera, expectedSupplier: CARNES.nombre    },
    ];
}

describe('[E2E] Weekly Order Workflow', () => {
    before(() => {
        AllureReporter.addSuite('E2E');
        AllureReporter.addFeature('Weekly Order Workflow');
    });

    // The app takes the order week from the device clock, so both orders land in the
    // same real week. That still covers rotation, which keys on each supplier's last
    // confirmed use (a timestamp), not on the week label.
    it('[E02] @e2e should rotate suppliers across two consecutive weekly orders', async () => {
        AllureReporter.addStory('Rotación de proveedores entre pedidos semanales');

        await AllureReporter.step('Semana 1: configurar catálogo (3 proveedores, 5 ingredientes)', async () => {
            await restoreBackupFlow(catalogo);
        });

        const semana1 = await AllureReporter.step('Semana 1: crear y confirmar pedido con 4 items', async () => {
            return placeOrderFlow(weeklyOrder(HUERTA.nombre, [5, 2, 3.5, 4]), { expectedHistoricoCount: 1 });
        });

        // Item order inside a group follows the app's unordered pedido_item query, so compare sorted.
        expect([...semana1[HUERTA.nombre]].sort()).toEqual(['Cebolla: 2 kg', 'Tomate: 5 kg']);
        expect([...semana1[CARNES.nombre]].sort()).toEqual(['Pollo: 3.5 kg', 'Ternera: 4 kg']);

        await AllureReporter.step('Semana 2: vaciar el pedido anterior', async () => {
            await clearPedidoFlow();
        });

        const semana2 = await AllureReporter.step('Semana 2: crear y confirmar pedido con los mismos ingredientes', async () => {
            return placeOrderFlow(weeklyOrder(MERCAFRESH.nombre, [6, 3, 2, 5]), { expectedHistoricoCount: 2 });
        });

        // Verduras rotated to the supplier unused in week 1; Carnes had nowhere to rotate.
        expect(Object.keys(semana2).sort()).toEqual([CARNES.nombre, MERCAFRESH.nombre].sort());
        expect(semana2[HUERTA.nombre]).toBeUndefined();
        expect([...semana2[MERCAFRESH.nombre]].sort()).toEqual(['Cebolla: 3 kg', 'Tomate: 6 kg']);

        const exported = await AllureReporter.step('Exportar backup', async () => exportBackupFlow());

        expect(exported.pedidosConfirmados).toHaveLength(2);
        const [pedido1, pedido2] = [...exported.pedidosConfirmados].sort((a, b) => a.id - b.id);
        expect(pedido1.texto).toContain(HUERTA.nombre);
        expect(pedido1.texto).not.toContain(MERCAFRESH.nombre);
        expect(pedido2.texto).toContain(MERCAFRESH.nombre);
        expect(pedido2.texto).not.toContain(HUERTA.nombre);

        // One supplier use per supplier group per confirmed order.
        const usos = exported.proveedorUsos
            .map(u => ({ pedido: u.pedidoConfirmadoId, proveedor: u.proveedorId }))
            .sort((a, b) => a.pedido - b.pedido || a.proveedor - b.proveedor);
        expect(usos).toEqual([
            { pedido: pedido1.id, proveedor: HUERTA.id },
            { pedido: pedido1.id, proveedor: CARNES.id },
            { pedido: pedido2.id, proveedor: MERCAFRESH.id },
            { pedido: pedido2.id, proveedor: CARNES.id },
        ].sort((a, b) => a.pedido - b.pedido || a.proveedor - b.proveedor));
    });
});
