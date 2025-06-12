export interface CreateCasoDeMantenimientoData {
  title: string;
  description: string;
  estado: string;
  priority: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail?: string;
  createdById: string;
  createdByName: string;
  createdByEmail?: string;
}

export interface CasoDeMantenimiento {
  id: string;
  displayId?: string;
  title: string;
  description: string;
  estado: string;
  priority: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail?: string;
  createdById: string;
  createdByName: string;
  createdByEmail?: string;
  createdAt: Date;
  updatedAt: Date;
} 