export interface CreateCasoMantenimientoLogEntryData {
  casoId: string;
  action: string;
  details?: string;
  userId: string;
  userName: string;
  userEmail?: string;
}

export interface CasoMantenimientoLogEntry {
  id: string;
  displayId?: string;
  casoId: string;
  action: string;
  details?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
  updatedAt: Date;
} 