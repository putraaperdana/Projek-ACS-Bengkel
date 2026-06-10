USE db_kampus_tutor_acs;

-- Stored procedure to complete a repair transaction.
-- Input: p_id_log INT, p_odometer_baru INT, p_components JSON
-- p_components example: '[{"id_suku_cadang":1,"kuantitas_dipakai":2},{"id_suku_cadang":5,"kuantitas_dipakai":1}]'

DROP PROCEDURE IF EXISTS SP_SelesaikanPerbaikan;
DELIMITER //
CREATE PROCEDURE SP_SelesaikanPerbaikan(
    IN p_id_log INT,
    IN p_odometer_baru INT,
    IN p_components JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE n INT DEFAULT 0;
    DECLARE v_id_suku INT;
    DECLARE v_qty_used INT;
    DECLARE v_new_qty INT;
    DECLARE v_no_pol VARCHAR(64);
    DECLARE v_old_odometer INT DEFAULT NULL;
    DECLARE v_exists INT DEFAULT 0;

    -- Basic validation: ensure log exists
    SELECT COUNT(*) INTO v_exists FROM Log_Perbaikan WHERE id_log = p_id_log;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Log_Perbaikan not found for provided id_log';
    END IF;

    -- Get vehicle id (nomor_polisi) for this log
    SELECT nomor_polisi INTO v_no_pol FROM Log_Perbaikan WHERE id_log = p_id_log LIMIT 1;
    -- capture old odometer
    SELECT odometer INTO v_old_odometer FROM Kendaraan_Operasional WHERE nomor_polisi = v_no_pol LIMIT 1;

    START TRANSACTION;

    -- 1) Update Kendaraan_Operasional: odometer and status
    UPDATE Kendaraan_Operasional
    SET odometer = p_odometer_baru,
        status = 'Aktif'
    WHERE nomor_polisi = v_no_pol;

    -- 2) Loop through JSON array of components
    SET n = JSON_LENGTH(p_components);
    SET i = 0;
    repair_loop: WHILE i < n DO
        SET v_id_suku = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_components, CONCAT('$[', i, '].id_suku_cadang'))) AS SIGNED);
        SET v_qty_used = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_components, CONCAT('$[', i, '].kuantitas_dipakai'))) AS SIGNED);

        IF v_id_suku IS NULL OR v_qty_used IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid component JSON structure';
        END IF;

        INSERT INTO Detail_Penggunaan_Komponen (id_log, id_suku_cadang, kuantitas_dipakai)
        VALUES (p_id_log, v_id_suku, v_qty_used);

        UPDATE Suku_Cadang
        SET kuantitas_fisik = kuantitas_fisik - v_qty_used
        WHERE id_suku_cadang = v_id_suku;

        SELECT kuantitas_fisik INTO v_new_qty FROM Suku_Cadang WHERE id_suku_cadang = v_id_suku;
        IF v_new_qty IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Suku_Cadang id not found';
        END IF;

        IF v_new_qty < 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for id_suku_cadang';
        END IF;

        SET i = i + 1;
    END WHILE repair_loop;

    -- Mark log as finished
    UPDATE Log_Perbaikan
    SET status = 'Selesai', tanggal = NOW(), odometer_lama = v_old_odometer, odometer_baru = p_odometer_baru
    WHERE id_log = p_id_log;

    COMMIT;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_UpdateKendaraanStatus;
DELIMITER //
CREATE PROCEDURE SP_UpdateKendaraanStatus(
    IN p_nomor_polisi VARCHAR(64),
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE Kendaraan_Operasional
    SET status = p_status
    WHERE nomor_polisi = p_nomor_polisi;
END //
DELIMITER ;

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

DROP PROCEDURE IF EXISTS SP_GetMechanics;
DELIMITER //
CREATE PROCEDURE SP_GetMechanics()
BEGIN
  SELECT u.id_user, u.nama, u.username
  FROM users u
  JOIN roles r ON u.id_role = r.id_role
  WHERE r.nama_role = 'Mekanik';
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_GetKendaraanForMekanik;
DELIMITER //
CREATE PROCEDURE SP_GetKendaraanForMekanik(IN p_id_mekanik INT)
BEGIN
  SELECT ko.nomor_polisi, ko.tahun, ko.odometer, ko.status,
         lp.id_log, lp.status AS repair_status, lp.assigned_at, lp.tanggal
  FROM Kendaraan_Operasional ko
  JOIN Log_Perbaikan lp ON lp.nomor_polisi = ko.nomor_polisi
  WHERE lp.id_mekanik = p_id_mekanik
    AND lp.status != 'Selesai'
  ORDER BY lp.assigned_at DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_AssignRepairToMekanik;
DELIMITER //
CREATE PROCEDURE SP_AssignRepairToMekanik(
    IN p_nomor_polisi VARCHAR(64),
    IN p_id_mekanik INT,
    IN p_assigned_by INT
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_log_id INT DEFAULT NULL;

  SELECT COUNT(*) INTO v_exists
  FROM Log_Perbaikan
  WHERE nomor_polisi = p_nomor_polisi AND status != 'Selesai';

  IF v_exists > 0 THEN
    SELECT id_log INTO v_log_id
    FROM Log_Perbaikan
    WHERE nomor_polisi = p_nomor_polisi AND status != 'Selesai'
    ORDER BY assigned_at DESC
    LIMIT 1;

    UPDATE Log_Perbaikan
    SET id_mekanik = p_id_mekanik,
        assigned_by = p_assigned_by,
        assigned_at = NOW(),
        status = 'Diperbaiki'
    WHERE id_log = v_log_id;
  ELSE
    INSERT INTO Log_Perbaikan (nomor_polisi, id_mekanik, assigned_by, assigned_at, tanggal, status)
    VALUES (p_nomor_polisi, p_id_mekanik, p_assigned_by, NOW(), NOW(), 'Diperbaiki');
    SELECT LAST_INSERT_ID() INTO v_log_id;
  END IF;

  UPDATE Kendaraan_Operasional
  SET status = 'Diperbaiki'
  WHERE nomor_polisi = p_nomor_polisi;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS SP_GetAssignedRepairByVehicle;
DELIMITER //
CREATE PROCEDURE SP_GetAssignedRepairByVehicle(
    IN p_nomor_polisi VARCHAR(64),
    IN p_id_mekanik INT
)
BEGIN
  SELECT lp.id_log, lp.nomor_polisi, lp.id_mekanik, lp.status, lp.assigned_at, lp.tanggal,
         ko.odometer, ko.status AS vehicle_status
  FROM Log_Perbaikan lp
  JOIN Kendaraan_Operasional ko ON ko.nomor_polisi = lp.nomor_polisi
  WHERE lp.nomor_polisi = p_nomor_polisi
    AND lp.id_mekanik = p_id_mekanik
    AND lp.status != 'Selesai'
  ORDER BY lp.assigned_at DESC
  LIMIT 1;
END //
DELIMITER ;

-- =====================================================
-- Exact SQL queries / views for required reports
-- 1) Laporan Kesiapan Armada: Percentage of 'Aktif' vs 'Diperbaiki'
-- Query (single-row summary):
-- SELECT
--   SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END) AS aktif_count,
--   SUM(CASE WHEN status = 'Diperbaiki' THEN 1 ELSE 0 END) AS diperbaiki_count,
--   COUNT(*) AS total,
--   ROUND(100*SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END)/COUNT(*),2) AS pct_aktif,
--   ROUND(100*SUM(CASE WHEN status = 'Diperbaiki' THEN 1 ELSE 0 END)/COUNT(*),2) AS pct_diperbaiki
-- FROM Kendaraan_Operasional;

DROP VIEW IF EXISTS vw_kesiapan_armada;
CREATE VIEW vw_kesiapan_armada AS
SELECT
  SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END) AS aktif_count,
  SUM(CASE WHEN status = 'Diperbaiki' THEN 1 ELSE 0 END) AS diperbaiki_count,
  COUNT(*) AS total,
  ROUND(100*SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END)/COUNT(*),2) AS pct_aktif,
  ROUND(100*SUM(CASE WHEN status = 'Diperbaiki' THEN 1 ELSE 0 END)/COUNT(*),2) AS pct_diperbaiki
FROM Kendaraan_Operasional;

-- 2) Laporan Defisit Inventaris: rows where kuantitas_fisik <= batas_minimum
DROP VIEW IF EXISTS vw_defisit_inventaris;
CREATE VIEW vw_defisit_inventaris AS
SELECT id_suku_cadang, nama, kategori, kuantitas_fisik, batas_minimum
FROM Suku_Cadang
WHERE kuantitas_fisik <= batas_minimum;

-- 3) Laporan Frekuensi Kerusakan Aset: COUNT(id_log) GROUP BY nomor_polisi
DROP VIEW IF EXISTS vw_frekuensi_kerusakan;
CREATE VIEW vw_frekuensi_kerusakan AS
SELECT nomor_polisi, COUNT(id_log) AS jumlah_kerusakan
FROM Log_Perbaikan
GROUP BY nomor_polisi
ORDER BY jumlah_kerusakan DESC;

-- 4) Laporan Distribusi Penugasan Mekanik: COUNT(id_log) GROUP BY id_mekanik
DROP VIEW IF EXISTS vw_distribusi_penugasan_mekanik;
CREATE VIEW vw_distribusi_penugasan_mekanik AS
SELECT id_mekanik, COUNT(id_log) AS jumlah_penugasan
FROM Log_Perbaikan
GROUP BY id_mekanik
ORDER BY jumlah_penugasan DESC;

-- 5) Laporan Konsumsi Komponen: SUM(kuantitas_dipakai) GROUP BY id_suku_cadang
DROP VIEW IF EXISTS vw_konsumsi_komponen;
CREATE VIEW vw_konsumsi_komponen AS
SELECT d.id_suku_cadang, s.nama AS nama_suku_cadang, SUM(d.kuantitas_dipakai) AS total_dipakai
FROM Detail_Penggunaan_Komponen d
JOIN Suku_Cadang s ON d.id_suku_cadang = s.id_suku_cadang
GROUP BY d.id_suku_cadang, s.nama
ORDER BY total_dipakai DESC;

-- End of file