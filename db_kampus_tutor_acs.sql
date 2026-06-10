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

DROP TABLE IF EXISTS `Mekanik`;
CREATE TABLE `Mekanik` (
  `id_mekanik` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'Mekanik_Pelaksana',
  PRIMARY KEY (`id_mekanik`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `Log_Perbaikan`;
CREATE TABLE `Log_Perbaikan` (
  `id_log` int(11) NOT NULL AUTO_INCREMENT,
  `nomor_polisi` varchar(64) NOT NULL,
  `id_mekanik` int(11) DEFAULT NULL,
  `odometer_lama` int(11) DEFAULT NULL,
  `odometer_baru` int(11) DEFAULT NULL,
  `tanggal` datetime DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Diperbaiki',
  PRIMARY KEY (`id_log`),
  KEY `nomor_polisi_idx` (`nomor_polisi`),
  KEY `id_mekanik_idx` (`id_mekanik`),
  CONSTRAINT `log_perbaikan_fk_kendaraan` FOREIGN KEY (`nomor_polisi`) REFERENCES `Kendaraan_Operasional` (`nomor_polisi`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `log_perbaikan_fk_mekanik` FOREIGN KEY (`id_mekanik`) REFERENCES `Mekanik` (`id_mekanik`) ON DELETE SET NULL ON UPDATE CASCADE
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
('Rem Belakang','Rem',20,4);

insert into `Kendaraan_Operasional` (nomor_polisi,tahun,odometer,status) values
('B 1234 ABC',2018,92000,'Aktif'),
('B 5678 XYZ',2017,15000,'Diperbaiki');

-- create users for login: username/password reflect role
insert into `Mekanik` (username,password,nama,role) values
('kepala','kepala_pass','Kepala Montir','Kepala_Montir'),
('mekanik','mekanik_pass','Mekanik Pelaksana','Mekanik_Pelaksana');

-- Example: open repair log for vehicle B 5678 XYZ
insert into `Log_Perbaikan` (nomor_polisi,id_mekanik,tanggal,status) values
('B 5678 XYZ',2,NOW(),'Diperbaiki');

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
    ), 0) AS delta
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

-- Login procedure for mechanics
DROP PROCEDURE IF EXISTS SP_LoginMekanik;
DELIMITER //
CREATE PROCEDURE SP_LoginMekanik(IN p_username VARCHAR(100), IN p_password VARCHAR(255))
BEGIN
  SELECT id_mekanik, username, nama, role
  FROM Mekanik
  WHERE username = p_username AND password = p_password
  LIMIT 1;
END //
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
