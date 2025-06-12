-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `category` ENUM('HardwareIssue', 'SoftwareIssue', 'NetworkIssue', 'AppAccess', 'InfoRequest', 'EquipmentMaintenance', 'PrintingIssue', 'EmailIssue', 'Other') NOT NULL DEFAULT 'Other';
