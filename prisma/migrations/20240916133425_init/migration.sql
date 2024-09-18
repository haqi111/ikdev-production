-- CreateTable
CREATE TABLE `Users` (
    `id` VARCHAR(191) NOT NULL,
    `nra` VARCHAR(191) NULL,
    `nama` VARCHAR(191) NOT NULL,
    `nim` VARCHAR(191) NOT NULL,
    `no_telp` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `jenis_kelamin` ENUM('MALE', 'FEMALE') NULL,
    `agama` ENUM('Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Other') NULL,
    `fakultas` VARCHAR(191) NOT NULL,
    `prodi` VARCHAR(191) NOT NULL,
    `angkatan` VARCHAR(191) NOT NULL,
    `status` ENUM('Active', 'Inactive') NULL,
    `image` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `hashRt` VARCHAR(191) NULL,

    UNIQUE INDEX `Users_nra_key`(`nra`),
    UNIQUE INDEX `Users_nim_key`(`nim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Candidate` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `no_telp` VARCHAR(191) NOT NULL,
    `jenis_kelamin` ENUM('MALE', 'FEMALE') NULL,
    `agama` ENUM('Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Other') NULL,
    `nim` VARCHAR(191) NOT NULL,
    `prodi` VARCHAR(191) NOT NULL,
    `fakultas` ENUM('FTI', 'FMB') NOT NULL,
    `angkatan` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `lk1` DOUBLE NULL,
    `lk2` DOUBLE NULL,
    `sc` DOUBLE NULL,
    `keaktifan` DOUBLE NULL,
    `rerata` DOUBLE NULL,
    `approval` ENUM('Accepted', 'Rejected', 'OnProgres') NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `Candidate_nim_key`(`nim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset` (
    `token` CHAR(21) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `validUntil` DATETIME(3) NOT NULL,

    UNIQUE INDEX `password_reset_user_id_key`(`user_id`),
    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset` ADD CONSTRAINT `password_reset_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
