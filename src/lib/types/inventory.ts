import { InventoryItemCategory, InventoryItemStatus, RamOption, StorageType } from '@prisma/client';

export interface CreateInventoryItemData {
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  processor: string;
  ram: string;
  storageType: string;
  storage: string;
  quantity: number;
  location: string;
  status: string;
  notes?: string;
  purchaseDate: Date;
  supplier: string;
  warrantyEndDate: Date;
  addedByUserId: string;
  addedByUserName: string;
}

export interface InventoryItem {
  id: string;
  displayId?: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  processor: string;
  ram: string;
  storageType: string;
  storage: string;
  quantity: number;
  location: string;
  status: string;
  notes?: string;
  purchaseDate: Date;
  supplier: string;
  warrantyEndDate: Date;
  addedByUserId: string;
  addedByUserName: string;
  createdAt: Date;
  updatedAt: Date;
} 