/*
  Warnings:

  - You are about to drop the column `checkin` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `checkout` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `datestamp` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `runtime` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `checkinouts` table. All the data in the column will be lost.
  - You are about to drop the column `user_email` on the `checkinouts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `checkinouts` DROP FOREIGN KEY `checkinouts_user_email_fkey`;

-- DropIndex
DROP INDEX `checkinouts_user_email_datestamp_key` ON `checkinouts`;

-- AlterTable
ALTER TABLE `checkinouts` DROP COLUMN `checkin`,
    DROP COLUMN `checkout`,
    DROP COLUMN `created_at`,
    DROP COLUMN `datestamp`,
    DROP COLUMN `is_active`,
    DROP COLUMN `runtime`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `user_email`,
    ADD COLUMN `checkType` INTEGER NULL,
    ADD COLUMN `difference` INTEGER NULL,
    ADD COLUMN `timestamp` DATETIME(3) NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `checkinouts_userId_timestamp_idx` ON `checkinouts`(`userId`, `timestamp`);

-- AddForeignKey
ALTER TABLE `checkinouts` ADD CONSTRAINT `checkinouts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
