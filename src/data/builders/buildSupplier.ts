import type { Proveedor } from '../types';

let _nextId = 100;

export function buildSupplier(overrides: Partial<Proveedor> = {}): Proveedor {
    return {
        id: _nextId++,
        nombre: 'Proveedor',
        tipo: 'General',
        ultimaSemanaGenerada: null,
        ...overrides,
    };
}
