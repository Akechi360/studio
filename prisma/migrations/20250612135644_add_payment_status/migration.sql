/*
  Warnings:

  - Added the required column `updatedAt` to the `ApprovalActivityLogEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userEmail` to the `ApprovalActivityLogEntry` table without a default value. This is not possible if the table is not empty.
  - Made the column `displayId` on table `auditlogentry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `displayId` on table `inventoryitem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `PaymentInstallment` table without a default value. This is not possible if the table is not empty.
  - Made the column `displayId` on table `ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `approvalactivitylogentry` DROP FOREIGN KEY `ApprovalActivityLogEntry_approvalRequestId_fkey`;

-- DropForeignKey
ALTER TABLE `paymentinstallment` DROP FOREIGN KEY `PaymentInstallment_approvalRequestId_fkey`;

-- DropIndex
DROP INDEX `ApprovalActivityLogEntry_displayId_key` ON `approvalactivitylogentry`;

-- AlterTable
ALTER TABLE `approvalactivitylogentry` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `userEmail` VARCHAR(191) NOT NULL,
    MODIFY `comment` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `auditlogentry` MODIFY `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `inventoryitem` MODIFY `displayId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `paymentinstallment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `ticket` MODIFY `displayId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `PaymentInstallment_status_idx` ON `PaymentInstallment`(`status`);

-- CreateIndex
CREATE INDEX `PaymentInstallment_dueDate_idx` ON `PaymentInstallment`(`dueDate`);

-- AddForeignKey
ALTER TABLE `PaymentInstallment` ADD CONSTRAINT `PaymentInstallment_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `ApprovalRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalActivityLogEntry` ADD CONSTRAINT `ApprovalActivityLogEntry_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `ApprovalRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
