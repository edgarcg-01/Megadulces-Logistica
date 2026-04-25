export interface Unit {
  id: string;
  placa: string;
  modelo: string;
  anio: number;
  tipo: string;
  capacidad: string;
  km: number;
  estado: string;
  propietario: string;
}

export interface Collaborator {
  id: string;
  nombre: string;
  roles: string[];
  tipo: 'fijo' | 'eventual';
  sueldoBase: number;
  estado: 'activo' | 'inactivo';
}

export interface Destination {
  id: string;
  nombre: string;
  comision_chofer: number;
  comision_ayudante: number;
}

export interface FinanceConfig {
  id: string;
  clave: string;
  categoria: string;
  valor: number;
  descripcion: string;
}

export interface Shipment {
  id: string;
  folio: string;
  fecha: string;
  unidad_id: string;
  origen: string;
  destino: string;
  km: number;
  flete: number;
  valor_carga: number;
  cajas: number;
  peso: number;
  estado: string;
}

export const SHIPMENT_STATUS = {
  PROGRAMADO: 'programado',
  EN_TRANSITO: 'en_transito',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
} as const;

export type ShipmentStatus = typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS];

export interface ShipmentStatusConfig {
  value: ShipmentStatus;
  label: string;
  color: string;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
}
