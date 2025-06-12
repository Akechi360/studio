/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `ApprovalActivityLogEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `ApprovalRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `Attachment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `AuditLogEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `CasoDeMantenimiento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `CasoMantenimientoLogEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `Falla` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `FallaBitacora` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `PaymentInstallment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[displayId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `displayId` was added to the `ApprovalActivityLogEntry` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `ApprovalRequest` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `Attachment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `CasoDeMantenimiento` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `CasoMantenimientoLogEntry` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `Comment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `Falla` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `FallaBitacora` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `displayId` was added to the `PaymentInstallment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `approvalactivitylogentry` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `approvalrequest` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `attachment` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `auditlogentry` ADD COLUMN `displayId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `casodemantenimiento` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `casomantenimientologentry` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `comment` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `falla` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `fallabitacora` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `inventoryitem` ADD COLUMN `displayId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `paymentinstallment` ADD COLUMN `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `displayId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `displayId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `IdCounter` (
    `entityName` VARCHAR(191) NOT NULL,
    `lastUsedNumber` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IdCounter_entityName_key`(`entityName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ApprovalActivityLogEntry_displayId_key` ON `ApprovalActivityLogEntry`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `ApprovalRequest_displayId_key` ON `ApprovalRequest`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `Attachment_displayId_key` ON `Attachment`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `AuditLogEntry_displayId_key` ON `AuditLogEntry`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `CasoDeMantenimiento_displayId_key` ON `CasoDeMantenimiento`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `CasoMantenimientoLogEntry_displayId_key` ON `CasoMantenimientoLogEntry`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `Comment_displayId_key` ON `Comment`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `Falla_displayId_key` ON `Falla`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `FallaBitacora_displayId_key` ON `FallaBitacora`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `InventoryItem_displayId_key` ON `InventoryItem`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `PaymentInstallment_displayId_key` ON `PaymentInstallment`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `Ticket_displayId_key` ON `Ticket`(`displayId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_displayId_key` ON `User`(`displayId`);
