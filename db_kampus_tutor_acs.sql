/*
SQLyog Community v13.2.1 (64 bit)
MySQL - 10.4.32-MariaDB : Database - db_kampus_tutor_acs
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`db_kampus_tutor_acs` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `db_kampus_tutor_acs`;



/* ===== Maintenance system tables ===== */

DROP TABLE IF EXISTS `Suku_Cadang`;
CREATE TABLE `Suku_Cadang` (
  `id_suku_cadang` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  `kategori` varchar(100) NOT NULL,
  `kuantitas_fisik` int(11) NOT NULL DEFAULT 0,
  `batas_minimum` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_suku_cadang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `Kendaraan_Operasional`;
CREATE TABLE `Kendaraan_Operasional` (
  `nomor_polisi` varchar(64) NOT NULL,
  `tahun` int(11) DEFAULT NULL,
  `odometer` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'Aktif',
  PRIMARY KEY (`nomor_polisi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_role` int(11) NOT NULL AUTO_INCREMENT,
  `nama_role` varchar(50) NOT NULL,
  PRIMARY KEY (`id_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `id_role` int(11) NOT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `username` (`username`),
  KEY `id_role_idx` (`id_role`),
  CONSTRAINT `users_fk_role` FOREIGN KEY (`id_role`) REFERENCES `roles` (`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `Log_Perbaikan`;
CREATE TABLE `Log_Perbaikan` (
  `id_log` int(11) NOT NULL AUTO_INCREMENT,
  `nomor_polisi` varchar(64) NOT NULL,
  `id_mekanik` int(11) DEFAULT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `odometer_lama` int(11) DEFAULT NULL,
  `odometer_baru` int(11) DEFAULT NULL,
  `tanggal` datetime DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Diperbaiki',
  PRIMARY KEY (`id_log`),
  KEY `nomor_polisi_idx` (`nomor_polisi`),
  KEY `id_mekanik_idx` (`id_mekanik`),
  KEY `assigned_by_idx` (`assigned_by`),
  CONSTRAINT `log_perbaikan_fk_kendaraan` FOREIGN KEY (`nomor_polisi`) REFERENCES `Kendaraan_Operasional` (`nomor_polisi`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `log_perbaikan_fk_mekanik` FOREIGN KEY (`id_mekanik`) REFERENCES `users` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `log_perbaikan_fk_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `Detail_Penggunaan_Komponen`;
CREATE TABLE `Detail_Penggunaan_Komponen` (
  `id_detail` int(11) NOT NULL AUTO_INCREMENT,
  `id_log` int(11) NOT NULL,
  `id_suku_cadang` int(11) NOT NULL,
  `kuantitas_dipakai` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_detail`),
  KEY `id_log_idx` (`id_log`),
  KEY `id_suku_idx` (`id_suku_cadang`),
  CONSTRAINT `detail_fk_log` FOREIGN KEY (`id_log`) REFERENCES `Log_Perbaikan` (`id_log`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `detail_fk_suku` FOREIGN KEY (`id_suku_cadang`) REFERENCES `Suku_Cadang` (`id_suku_cadang`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* Sample data for maintenance */
insert into `Suku_Cadang` (nama,kategori,kuantitas_fisik,batas_minimum) values
('Filter Oli','Filtrasi',50,10),
('Busi NGK','Elektrikal',30,5),
('Rem Belakang','Rem',20,4),
('Kampas Rem Depan','Rem',45,8),
('Kampas Rem Belakang','Rem',40,8),
('Selang Rem','Rem',18,5),
('Aki Kering','Elektrikal',25,5),
('Lampu Depan','Elektrikal',22,4),
('Sekring 10A','Elektrikal',70,15),
('Kabel Busi','Elektrikal',35,6),
('Radiator','Pendingin',12,3),
('Kipas Pendingin','Pendingin',14,4),
('Termostat','Pendingin',9,2),
('Seal Kepala Silinder','Mesin',8,2),
('Gasket Mesin','Mesin',15,4),
('Oli Mesin 10W-40','Filtrasi',120,20),
('Filter Udara','Filtrasi',55,10),
('Filter Bahan Bakar','Filtrasi',40,8),
('Pompa Bensin','Bahan Bakar',10,3),
('Injektor','Bahan Bakar',12,4),
('Belt Fan','Suspensi',18,6),
('Bush Arm','Suspensi',22,5),
('Shock Absorber','Suspensi',16,4),
('Arm Stabilizer','Suspensi',11,3),
('Bearing Roda Depan','Roda',27,7),
('Bearing Roda Belakang','Roda',23,6),
('Ban Cadangan','Roda',5,1),
('Velg Alloy','Roda',6,1),
('Kepala Silinder','Mesin',3,1),
('Pompa Air','Pendingin',11,3),
('Sensor Oksigen','Elektrikal',13,4),
('Motor Starter','Elektrikal',7,2),
('Alternator','Elektrikal',8,2),
('Seal Kopling','Transmisi',9,2),
('Plat Kopling','Transmisi',10,3),
('Flywheel','Transmisi',5,1),
('Bush Transmisi','Transmisi',14,4),
('Kabel Kopling','Transmisi',20,5),
('Busi Iridium','Elektrikal',24,5),
('Shock Mount','Suspensi',13,3),
('Pelek','Roda',7,2),
('Lampu Rem','Elektrikal',19,5),
('Kaca Spion','Karoseri',12,4),
('Karet Pintu','Karoseri',26,6),
('Peredam Suara','Karoseri',17,5);

insert into `Kendaraan_Operasional` (nomor_polisi,tahun,odometer,status) values
('B 1234 ABC',2018,92000,'Aktif'),
('B 5678 XYZ',2017,15000,'Diperbaiki');

-- create roles and users for login
insert into `roles` (nama_role) values
('Kepala_Mekanik'),
('Mekanik');

insert into `users` (username,password,nama,id_role) values
('kepala','123','Kepala Montir',1),
('mekanik1','123','Mekanik A',2),
('mekanik2','123','Mekanik B',2),
('mekanik3','123','Mekanik C',2);

insert into `users` (username,password,nama,id_role) values
('kepala','123','Kepala Montir',1),
('mekanik1','123','Mekanik A',2),
('mekanik2','123','Mekanik B',2),
('mekanik3','123','Mekanik C',2);

-- Example: open repair log for vehicle B 5678 XYZ
insert into `Log_Perbaikan` (nomor_polisi,id_mekanik,assigned_by,assigned_at,tanggal,status) values
('B 5678 XYZ',2,1,NOW(),NOW(),'Diperbaiki');

/* End maintenance tables */

-- Stored procedure wrappers for maintenance reads (use CALL from app)
DROP PROCEDURE IF EXISTS SP_GetKendaraan;
DELIMITER //
CREATE PROCEDURE SP_GetKendaraan()
BEGIN
  SELECT ko.nomor_polisi, ko.tahun, ko.odometer, ko.status,
    COALESCE((
      SELECT lp.odometer_baru - lp.odometer_lama
      FROM Log_Perbaikan lp
      WHERE lp.nomor_polisi = ko.nomor_polisi
      ORDER BY lp.tanggal DESC
      LIMIT 1
    ), 0) AS delta,
    (SELECT u.nama
     FROM Log_Perbaikan lp
     JOIN users u ON lp.id_mekanik = u.id_user
     WHERE lp.nomor_polisi = ko.nomor_polisi
       AND lp.status != 'Selesai'
     ORDER BY lp.assigned_at DESC
     LIMIT 1) AS assigned_mechanic,
    (SELECT lp.id_mekanik
     FROM Log_Perbaikan lp
     WHERE lp.nomor_polisi = ko.nomor_polisi
       AND lp.status != 'Selesai'
     ORDER BY lp.assigned_at DESC
     LIMIT 1) AS assigned_mechanic_id
  FROM Kendaraan_Operasional ko;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_GetCategories;
DELIMITER //
CREATE PROCEDURE SP_GetCategories()
BEGIN
  SELECT DISTINCT kategori FROM Suku_Cadang;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_GetSukuByKategori;
DELIMITER //
CREATE PROCEDURE SP_GetSukuByKategori(IN p_kategori VARCHAR(100))
BEGIN
  SELECT id_suku_cadang, nama, kuantitas_fisik, batas_minimum FROM Suku_Cadang WHERE kategori = p_kategori;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_GetReports;
DELIMITER //
CREATE PROCEDURE SP_GetReports()
BEGIN
  SELECT * FROM vw_kesiapan_armada;
  SELECT * FROM vw_defisit_inventaris;
  SELECT * FROM vw_frekuensi_kerusakan;
  SELECT * FROM vw_distribusi_penugasan_mekanik;
  SELECT * FROM vw_konsumsi_komponen;
END //
DELIMITER ;

-- Login procedure for users
DROP PROCEDURE IF EXISTS SP_LoginUser;
DELIMITER //
CREATE PROCEDURE SP_LoginUser(IN p_username VARCHAR(100), IN p_password VARCHAR(255))
BEGIN
  SELECT u.id_user, u.username, u.nama, r.nama_role AS role
  FROM users u
  JOIN roles r ON u.id_role = r.id_role
  WHERE u.username = p_username AND u.password = p_password
  LIMIT 1;
END //
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
