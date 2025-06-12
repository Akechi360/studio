import { PrismaClient, InventoryItemCategory, InventoryItemStatus, RamOption, StorageType } from '@prisma/client';
import { CreateInventoryItemData, InventoryItem } from '../types/inventory';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createInventoryItem(data: CreateInventoryItemData): Promise<InventoryItem> {
  const { name, category, brand, model, serialNumber, processor, ram, storageType, storage, quantity, location, status, notes, purchaseDate, supplier, warrantyEndDate, addedByUserId, addedByUserName } = data;
  const displayId = await generateSequentialId('InventoryItem');
  const item = await prisma.inventoryItem.create({
    data: {
      name,
      category,
      brand,
      model,
      serialNumber,
      processor,
      ram,
      storageType,
      storage,
      quantity,
      location,
      status,
      notes,
      purchaseDate,
      supplier,
      warrantyEndDate,
      addedByUserId,
      addedByUserName,
      displayId,
    },
  });
  return item;
} 