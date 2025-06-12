export interface CreateFallaBitacoraData {
  fallaId: string;
  action: string;
  userId: string;
  userName: string;
}

export interface FallaBitacora {
  id: string;
  displayId?: string;
  fallaId: string;
  action: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
} 