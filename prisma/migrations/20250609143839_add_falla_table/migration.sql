/*
  Warnings:

  - The values [Telefono IP] on the enum `InventoryItem_category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `inventoryitem` MODIFY `category` ENUM('Computadora', 'Monitor', 'Teclado', 'Mouse', 'Impresora', 'Escaner', 'Router', 'Switch', 'Servidor', 'Laptop', 'Tablet', 'Proyector', 'TelefonoIP', 'OtroPeriferico', 'Software', 'Licencia', 'Otro') NOT NULL,
    MODIFY `storageType` ENUM('HDD', 'SSD', 'NoEspecificado') NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('User', 'Admin', 'Presidente', 'Electromedicina') NOT NULL DEFAULT 'User';

-- CreateTable
CREATE TABLE `Falla` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `equipoId` VARCHAR(191) NULL,
    `equipoNombre` VARCHAR(191) NOT NULL,
    `equipoUbicacion` VARCHAR(191) NOT NULL,
    `equipoFabricante` VARCHAR(191) NULL,
    `equipoModelo` VARCHAR(191) NULL,
    `equipoNumeroSerie` VARCHAR(191) NULL,
    `ubicacion` VARCHAR(191) NOT NULL,
    `severidad` ENUM('CRITICA', 'ALTA', 'MEDIA', 'BAJA') NOT NULL,
    `tipoFalla` ENUM('ELECTRICA', 'MECANICA', 'SOFTWARE', 'SENSOR', 'CALIBRACION', 'RUIDO_VIBRACION', 'FUGA', 'OTRO') NOT NULL,
    `impacto` VARCHAR(191) NULL,
    `reportadoPorId` VARCHAR(191) NOT NULL,
    `fechaDeteccion` DATETIME(3) NOT NULL,
    `adjuntos` JSON NULL,
    `estado` ENUM('REPORTADA', 'EN_DIAGNOSTICO', 'PENDIENTE_PIEZA', 'EN_REPARACION_INTERNA', 'ESCALADA_EXTERNO', 'EN_CALIBRACION', 'RESUELTA', 'CERRADA', 'DUPLICADA', 'NO_SE_REPRODUCE') NOT NULL,
    `asignadoAId` VARCHAR(191) NULL,
    `accionesTomadas` VARCHAR(191) NULL,
    `piezasUtilizadas` JSON NULL,
    `pruebasPost` VARCHAR(191) NULL,
    `fechaResolucion` DATETIME(3) NULL,
    `causaRaiz` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FallaBitacora` (
    `id` VARCHAR(191) NOT NULL,
    `fallaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `mensaje` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adjuntos` JSON NULL,
    `tipo` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Falla` ADD CONSTRAINT `Falla_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Falla` ADD CONSTRAINT `Falla_asignadoAId_fkey` FOREIGN KEY (`asignadoAId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FallaBitacora` ADD CONSTRAINT `FallaBitacora_fallaId_fkey` FOREIGN KEY (`fallaId`) REFERENCES `Falla`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FallaBitacora` ADD CONSTRAINT `FallaBitacora_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
