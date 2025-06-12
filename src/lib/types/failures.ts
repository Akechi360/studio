export interface CreateFallaData {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail?: string;
  createdById: string;
  createdByName: string;
  createdByEmail?: string;
}

export interface Falla {
  id: string;
  displayId?: string;
  title: string;
  description: string;
  status: string;
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