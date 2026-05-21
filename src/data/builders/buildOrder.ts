import type { PedidoItem } from '../types';

let _nextId = 100;

export function buildOrder(overrides: Partial<PedidoItem> = {}): PedidoItem {
    return {
        id: _nextId++,
        itemId: null,
        nombre: 'Pedido',
        unidadNombre: 'kg',
        tipoProveedor: null,
        proveedorId: null,
        cantidad: 1.0,
        semana: currentIsoWeek(),
        ...overrides,
    };
}

function currentIsoWeek(): string {
    const now = new Date();
    const jan4 = new Date(now.getFullYear(), 0, 4);
    const week = Math.ceil(((now.getTime() - jan4.getTime()) / 86_400_000 + jan4.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
