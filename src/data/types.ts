export interface Ingrediente {
    id: number;
    nombre: string;
    unidadMedidaId: number;
    tipoProveedor: string | null;
}

export interface Proveedor {
    id: number;
    nombre: string;
    tipo: string;
    ultimaSemanaGenerada: string | null;
}

export interface UnidadMedida {
    id: number;
    nombre: string;
    esPredeterminada: boolean;
}

export interface PedidoItem {
    id: number;
    itemId: number | null;
    nombre: string;
    unidadNombre: string;
    tipoProveedor: string | null;
    proveedorId: number | null;
    cantidad: number;
    semana: string;
}

export interface PedidoConfirmado {
    id: number;
    semana: string;
    fechaGeneracion: string;
    texto: string;
}

export interface ProveedorUso {
    id: number;
    proveedorId: number;
    tipo: string;
    fechaUso: string;
    pedidoConfirmadoId: number;
}

export interface ChefPlannerBackup {
    version: number;
    exportadoEn: string;
    proveedores: Proveedor[];
    unidadesMedida: UnidadMedida[];
    items: Ingrediente[];
    pedidoItems: PedidoItem[];
    pedidosConfirmados: PedidoConfirmado[];
    proveedorUsos: ProveedorUso[];
}
