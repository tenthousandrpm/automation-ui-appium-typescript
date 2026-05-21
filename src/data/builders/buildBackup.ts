import type { ChefPlannerBackup, Ingrediente, Proveedor, PedidoItem, UnidadMedida } from '../types';

const DEFAULT_UNITS: UnidadMedida[] = [
    { id: 1, nombre: 'kg', esPredeterminada: true },
    { id: 2, nombre: 'g', esPredeterminada: false },
    { id: 3, nombre: 'unidades', esPredeterminada: false },
    { id: 4, nombre: 'cajas', esPredeterminada: false },
    { id: 5, nombre: 'botellas', esPredeterminada: false },
    { id: 6, nombre: 'bolsas', esPredeterminada: false },
];

interface BuildBackupOptions {
    items?: Ingrediente[];
    proveedores?: Proveedor[];
    pedidoItems?: PedidoItem[];
    unidadesMedida?: UnidadMedida[];
}

export function buildBackup(options: BuildBackupOptions = {}): ChefPlannerBackup {
    return {
        version: 1,
        exportadoEn: new Date().toISOString().slice(0, 19),
        unidadesMedida: options.unidadesMedida ?? DEFAULT_UNITS,
        proveedores: options.proveedores ?? [],
        items: options.items ?? [],
        pedidoItems: options.pedidoItems ?? [],
        pedidosConfirmados: [],
        proveedorUsos: [],
    };
}
