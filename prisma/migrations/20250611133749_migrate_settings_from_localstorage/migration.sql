-- AlterTable
ALTER TABLE `user` ADD COLUMN `customAppName` VARCHAR(191) NULL,
    ADD COLUMN `emailOnNewComment` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `emailOnNewTicket` BOOLEAN NOT NULL DEFAULT true;
