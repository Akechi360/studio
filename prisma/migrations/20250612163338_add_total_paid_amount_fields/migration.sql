-- AlterTable
ALTER TABLE `approvalrequest` ADD COLUMN `hasOverduePayments` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nextDueDate` DATETIME(3) NULL,
    ADD COLUMN `remainingAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `totalPaidAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `paymentinstallment` ADD COLUMN `daysOverdue` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isOverdue` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `ApprovalRequest_status_type_idx` ON `ApprovalRequest`(`status`, `type`);

-- CreateIndex
CREATE INDEX `ApprovalRequest_requesterId_status_idx` ON `ApprovalRequest`(`requesterId`, `status`);

-- CreateIndex
CREATE INDEX `ApprovalRequest_approverId_status_idx` ON `ApprovalRequest`(`approverId`, `status`);

-- CreateIndex
CREATE INDEX `ApprovalRequest_hasOverduePayments_idx` ON `ApprovalRequest`(`hasOverduePayments`);

-- CreateIndex
CREATE INDEX `PaymentInstallment_isOverdue_idx` ON `PaymentInstallment`(`isOverdue`);

-- CreateIndex
CREATE INDEX `PaymentInstallment_status_dueDate_idx` ON `PaymentInstallment`(`status`, `dueDate`);

-- CreateIndex
CREATE INDEX `PaymentInstallment_approvalRequestId_status_idx` ON `PaymentInstallment`(`approvalRequestId`, `status`);
