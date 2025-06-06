-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('User', 'Admin', 'Presidente') NOT NULL DEFAULT 'User',
    `avatarUrl` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` ENUM('Low', 'Medium', 'High') NOT NULL,
    `status` ENUM('Open', 'InProgress', 'Resolved', 'Closed') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NULL,

    INDEX `Ticket_userId_idx`(`userId`),
    INDEX `Ticket_status_idx`(`status`),
    INDEX `Ticket_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticketId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userAvatarUrl` VARCHAR(191) NULL,

    INDEX `Comment_ticketId_idx`(`ticketId`),
    INDEX `Comment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `type` VARCHAR(191) NULL,
    `ticketId` VARCHAR(191) NULL,
    `approvalRequestId` VARCHAR(191) NULL,

    INDEX `Attachment_ticketId_idx`(`ticketId`),
    INDEX `Attachment_approvalRequestId_idx`(`approvalRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('Computadora', 'Monitor', 'Teclado', 'Mouse', 'Impresora', 'Escaner', 'Router', 'Switch', 'Servidor', 'Laptop', 'Tablet', 'Proyector', 'Telefono IP', 'OtroPeriferico', 'Software', 'Licencia', 'Otro') NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `serialNumber` VARCHAR(191) NULL,
    `processor` VARCHAR(191) NULL,
    `ram` ENUM('NoEspecificado', '2GB', '4GB', '8GB', '12GB', '16GB', '32GB', '64GB', 'Otro') NULL,
    `storageType` ENUM('HDD', 'SSD') NULL,
    `storage` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `location` VARCHAR(191) NULL,
    `status` ENUM('EnUso', 'EnAlmacen', 'EnReparacion', 'DeBaja', 'Perdido') NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `purchaseDate` DATETIME(3) NULL,
    `supplier` VARCHAR(191) NULL,
    `warrantyEndDate` DATETIME(3) NULL,
    `addedByUserId` VARCHAR(191) NOT NULL,
    `addedByUserName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `InventoryItem_serialNumber_key`(`serialNumber`),
    INDEX `InventoryItem_category_idx`(`category`),
    INDEX `InventoryItem_status_idx`(`status`),
    INDEX `InventoryItem_location_idx`(`location`),
    INDEX `InventoryItem_addedByUserId_idx`(`addedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalRequest` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('Compra', 'PagoProveedor') NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('Pendiente', 'Aprobado', 'Rechazado', 'InformacionSolicitada') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `requesterName` VARCHAR(191) NOT NULL,
    `requesterEmail` VARCHAR(191) NULL,
    `approverId` VARCHAR(191) NULL,
    `approverName` VARCHAR(191) NULL,
    `approverComment` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `infoRequestedAt` DATETIME(3) NULL,
    `itemDescription` VARCHAR(191) NULL,
    `estimatedPrice` DOUBLE NULL,
    `supplierCompra` VARCHAR(191) NULL,
    `supplierPago` VARCHAR(191) NULL,
    `totalAmountToPay` DOUBLE NULL,
    `approvedAmount` DOUBLE NULL,
    `approvedPaymentType` ENUM('Contado', 'Cuotas') NULL,

    INDEX `ApprovalRequest_requesterId_idx`(`requesterId`),
    INDEX `ApprovalRequest_approverId_idx`(`approverId`),
    INDEX `ApprovalRequest_status_idx`(`status`),
    INDEX `ApprovalRequest_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentInstallment` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `approvalRequestId` VARCHAR(191) NOT NULL,

    INDEX `PaymentInstallment_approvalRequestId_idx`(`approvalRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalActivityLogEntry` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `comment` TEXT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `approvalRequestId` VARCHAR(191) NOT NULL,

    INDEX `ApprovalActivityLogEntry_approvalRequestId_idx`(`approvalRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CasoDeMantenimiento` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `equipment` VARCHAR(191) NULL,
    `priority` ENUM('Baja', 'Media', 'Alta', 'Crítica') NOT NULL,
    `currentStatus` ENUM('Registrado', 'PendientePresupuesto', 'PresupuestoAprobado', 'En Servicio/Reparación', 'PendienteRespaldo', 'Resuelto', 'Cancelado') NOT NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedProviderName` VARCHAR(191) NOT NULL,
    `providerContactPerson` VARCHAR(191) NULL,
    `expectedResolutionDate` DATETIME(3) NULL,
    `lastFollowUpDate` DATETIME(3) NULL,
    `nextFollowUpDate` DATETIME(3) NULL,
    `resolutionDetails` TEXT NULL,
    `cost` DOUBLE NULL,
    `invoicingDetails` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `registeredByUserId` VARCHAR(191) NOT NULL,
    `registeredByUserName` VARCHAR(191) NOT NULL,

    INDEX `CasoDeMantenimiento_registeredByUserId_idx`(`registeredByUserId`),
    INDEX `CasoDeMantenimiento_currentStatus_idx`(`currentStatus`),
    INDEX `CasoDeMantenimiento_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CasoMantenimientoLogEntry` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL,
    `notes` TEXT NOT NULL,
    `statusAfterAction` ENUM('Registrado', 'PendientePresupuesto', 'PresupuestoAprobado', 'En Servicio/Reparación', 'PendienteRespaldo', 'Resuelto', 'Cancelado') NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `casoId` VARCHAR(191) NOT NULL,

    INDEX `CasoMantenimientoLogEntry_casoId_idx`(`casoId`),
    INDEX `CasoMantenimientoLogEntry_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLogEntry` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userEmail` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,

    INDEX `AuditLogEntry_userEmail_idx`(`userEmail`),
    INDEX `AuditLogEntry_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `ApprovalRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryItem` ADD CONSTRAINT `InventoryItem_addedByUserId_fkey` FOREIGN KEY (`addedByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalRequest` ADD CONSTRAINT `ApprovalRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalRequest` ADD CONSTRAINT `ApprovalRequest_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentInstallment` ADD CONSTRAINT `PaymentInstallment_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `ApprovalRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalActivityLogEntry` ADD CONSTRAINT `ApprovalActivityLogEntry_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `ApprovalRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasoDeMantenimiento` ADD CONSTRAINT `CasoDeMantenimiento_registeredByUserId_fkey` FOREIGN KEY (`registeredByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasoMantenimientoLogEntry` ADD CONSTRAINT `CasoMantenimientoLogEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasoMantenimientoLogEntry` ADD CONSTRAINT `CasoMantenimientoLogEntry_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `CasoDeMantenimiento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLogEntry` ADD CONSTRAINT `AuditLogEntry_userEmail_fkey` FOREIGN KEY (`userEmail`) REFERENCES `User`(`email`) ON DELETE SET NULL ON UPDATE CASCADE;
