import { SeveridadFalla, TipoFalla, EstadoFalla } from "@prisma/client";

export interface FallaFormValues {
  titulo: string;
  descripcion: string;
  equipoId?: string;
  equipoNombre: string;
  equipoUbicacion: string;
  equipoFabricante?: string;
  equipoModelo?: string;
  equipoNumeroSerie?: string;
  ubicacion: string;
  severidad: SeveridadFalla;
  tipoFalla: TipoFalla;
  impacto?: string;
  adjuntos?: File[];
}

export interface FallaFilter {
  severidad?: SeveridadFalla[];
  estado?: EstadoFalla[];
  equipoId?: string;
  ubicacion?: string;
  tipoFalla?: TipoFalla[];
  tecnicoId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
} 