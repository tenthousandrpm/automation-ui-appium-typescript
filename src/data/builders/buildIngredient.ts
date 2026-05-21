import type { Ingrediente } from '../types';

let _nextId = 100;

export function buildIngredient(overrides: Partial<Ingrediente> = {}): Ingrediente {
    return {
        id: _nextId++,
        nombre: 'Ingrediente',
        unidadMedidaId: 1,
        tipoProveedor: null,
        ...overrides,
    };
}
