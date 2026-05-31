-- =========================================================
-- Arsitektur Bengkel Desktop - DDL + Stored Procedures
-- DBMS target: MySQL 8+
-- Fitur inti:
-- 1) 4 role: user, admin, mechanic, cashier
-- 2) master: pengguna, kendaraan, suku_cadang
-- 3) transaksi: reservasi, detail_reservasi
-- 4) semua logika bisnis dijalankan via stored procedure
-- =========================================================
DROP DATABASE IF EXISTS bengkel_db;

CREATE DATABASE IF NOT EXISTS bengkel_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE bengkel_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS laporan_audit;
DROP TABLE IF EXISTS pembayaran;
DROP TABLE IF EXISTS detail_reservasi;
DROP TABLE IF EXISTS reservasi;
DROP TABLE IF EXISTS kendaraan;
DROP TABLE IF EXISTS suku_cadang;
DROP TABLE IF EXISTS pengguna;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- MASTER TABLES
-- =========================================================

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pengguna (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(150) NOT NULL,
  nomor_hp VARCHAR(30),
  email VARCHAR(150),
  alamat TEXT,
  no_plat VARCHAR(20),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pengguna_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE kendaraan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pengguna_id INT NOT NULL,
  no_polisi VARCHAR(20) NOT NULL UNIQUE,
  merk VARCHAR(50) NOT NULL,
  tipe VARCHAR(50),
  tahun INT,
  warna VARCHAR(30),
  nomor_rangka VARCHAR(50),
  nomor_mesin VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kendaraan_pengguna FOREIGN KEY (pengguna_id) REFERENCES pengguna(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE suku_cadang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_suku_cadang VARCHAR(50) NOT NULL UNIQUE,
  nama_suku_cadang VARCHAR(150) NOT NULL,
  satuan VARCHAR(30) NOT NULL DEFAULT 'pcs',
  stok_aktual INT NOT NULL DEFAULT 0,
  stok_minimum INT NOT NULL DEFAULT 0,
  harga_beli DECIMAL(14,2) NOT NULL DEFAULT 0,
  harga_jual DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_suku_stok_nonneg CHECK (stok_aktual >= 0),
  CONSTRAINT chk_suku_min_nonneg CHECK (stok_minimum >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- TRANSACTION TABLES
-- =========================================================

CREATE TABLE reservasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_reservasi VARCHAR(50) NOT NULL UNIQUE,
  pengguna_id INT NOT NULL,
  kendaraan_id INT NOT NULL,
  mekanik_id INT NULL,
  keluhan_awal TEXT NOT NULL,
  keluhan_aktual TEXT,
  status ENUM('MENUNGGU','DALAM_PENGECEKAN','MENUNGGU_PEMBAYARAN','LUNAS','BATAL') NOT NULL DEFAULT 'MENUNGGU',
  total_jasa DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_suku_cadang DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_tagihan DECIMAL(14,2) NOT NULL DEFAULT 0,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  diperbarui_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tanggal_pembayaran DATETIME NULL,
  CONSTRAINT fk_reservasi_user FOREIGN KEY (pengguna_id) REFERENCES pengguna(id),
  CONSTRAINT fk_reservasi_kendaraan FOREIGN KEY (kendaraan_id) REFERENCES kendaraan(id),
  CONSTRAINT fk_reservasi_mekanik FOREIGN KEY (mekanik_id) REFERENCES pengguna(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE detail_reservasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservasi_id INT NOT NULL,
  suku_cadang_id INT NOT NULL,
  qty INT NOT NULL,
  harga_satuan DECIMAL(14,2) NOT NULL,
  subtotal DECIMAL(14,2) NOT NULL,
  tanggal_pakai DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_detail_reservasi_reservasi FOREIGN KEY (reservasi_id) REFERENCES reservasi(id) ON DELETE CASCADE,
  CONSTRAINT fk_detail_reservasi_suku FOREIGN KEY (suku_cadang_id) REFERENCES suku_cadang(id),
  CONSTRAINT chk_detail_qty_pos CHECK (qty > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pelunasan / audit pembayaran transaksi SQL
CREATE TABLE pembayaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservasi_id INT NOT NULL UNIQUE,
  kasir_id INT NOT NULL,
  metode_pembayaran ENUM('CASH','TRANSFER','QRIS') NOT NULL DEFAULT 'CASH',
  jumlah_bayar DECIMAL(14,2) NOT NULL,
  jumlah_kembali DECIMAL(14,2) NOT NULL DEFAULT 0,
  status_bayar ENUM('VALID','GAGAL') NOT NULL DEFAULT 'VALID',
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pembayaran_reservasi FOREIGN KEY (reservasi_id) REFERENCES reservasi(id) ON DELETE CASCADE,
  CONSTRAINT fk_pembayaran_kasir FOREIGN KEY (kasir_id) REFERENCES pengguna(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE laporan_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis_aksi VARCHAR(50) NOT NULL,
  referensi_id INT NULL,
  keterangan TEXT,
  dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_pengguna_role ON pengguna(role_id);
CREATE INDEX idx_pengguna_username ON pengguna(username);
CREATE INDEX idx_kendaraan_pengguna ON kendaraan(pengguna_id);
CREATE INDEX idx_reservasi_user ON reservasi(pengguna_id);
CREATE INDEX idx_reservasi_kendaraan ON reservasi(kendaraan_id);
CREATE INDEX idx_reservasi_mekanik ON reservasi(mekanik_id);
CREATE INDEX idx_detail_reservasi_reservasi ON detail_reservasi(reservasi_id);
CREATE INDEX idx_detail_reservasi_suku ON detail_reservasi(suku_cadang_id);
CREATE INDEX idx_detail_reservasi_tanggal ON detail_reservasi(tanggal_pakai);

-- =========================================================
-- SEED ROLES
-- =========================================================

INSERT INTO roles (kode, nama) VALUES
('USER', 'User'),
('ADMIN', 'Admin'),
('MECH', 'Mekanik'),
('CASH', 'Kasir')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- =========================================================
-- SEED DUMMY USERS
-- =========================================================

INSERT INTO pengguna (
  role_id, username, password_hash, nama_lengkap, nomor_hp, email, alamat, no_plat
)
SELECT
  r.id,
  'admin',
  SHA2('123', 256),
  'Admin Bengkel',
  NULL,
  NULL,
  NULL,
  NULL
FROM roles r
WHERE r.kode = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1
    FROM pengguna p
    WHERE p.username = 'admin'
  );

INSERT INTO pengguna (
  role_id, username, password_hash, nama_lengkap, nomor_hp, email, alamat, no_plat
)
SELECT
  r.id,
  'mekanik',
  SHA2('123', 256),
  'Mekanik Bengkel',
  NULL,
  NULL,
  NULL,
  NULL
FROM roles r
WHERE r.kode = 'MECH'
  AND NOT EXISTS (
    SELECT 1
    FROM pengguna p
    WHERE p.username = 'mekanik'
  );

INSERT INTO pengguna (
  role_id, username, password_hash, nama_lengkap, nomor_hp, email, alamat, no_plat
)
SELECT
  r.id,
  'kasir',
  SHA2('123', 256),
  'Kasir Bengkel',
  NULL,
  NULL,
  NULL,
  NULL
FROM roles r
WHERE r.kode = 'CASH'
  AND NOT EXISTS (
    SELECT 1
    FROM pengguna p
    WHERE p.username = 'kasir'
  );

-- =========================================================
-- STORED PROCEDURES - AUTH & MASTER
-- =========================================================

DROP PROCEDURE IF EXISTS sp_auth_login;
DROP PROCEDURE IF EXISTS sp_pengguna_create;
DROP PROCEDURE IF EXISTS sp_pengguna_update_profile;
DROP PROCEDURE IF EXISTS sp_kendaraan_upsert;
DROP PROCEDURE IF EXISTS sp_suku_cadang_upsert;
DROP PROCEDURE IF EXISTS sp_reservasi_inisiasi;
DROP PROCEDURE IF EXISTS sp_reservasi_penugasan_mekanik;
DROP PROCEDURE IF EXISTS sp_reservasi_diagnosis_mekanik;
DROP PROCEDURE IF EXISTS sp_reservasi_hitung_tagihan;
DROP PROCEDURE IF EXISTS sp_pembayaran_kasir_validasi;
DROP PROCEDURE IF EXISTS sp_laporan_pendapatan_harian;
DROP PROCEDURE IF EXISTS sp_laporan_peringkat_konsumsi_suku_cadang;
DROP PROCEDURE IF EXISTS sp_laporan_kinerja_diagnosis_mekanik;
DROP PROCEDURE IF EXISTS sp_laporan_riwayat_servis_klien;
DROP PROCEDURE IF EXISTS sp_laporan_defisit_stok_harian;

DELIMITER $$

CREATE PROCEDURE sp_auth_login(
  IN p_username VARCHAR(100),
  IN p_password VARCHAR(255)
)
BEGIN
  SELECT
    u.id AS pengguna_id,
    u.username,
    u.nama_lengkap,
    r.kode AS role_kode,
    r.nama AS role_nama,
    u.nomor_hp,
    u.email,
    u.no_plat,
    u.is_active
  FROM pengguna u
  JOIN roles r ON r.id = u.role_id
  WHERE u.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
    AND u.password_hash = SHA2(p_password, 256)
    AND u.is_active = 1;
END$$

CREATE PROCEDURE sp_pengguna_create(
  IN p_role_kode VARCHAR(20),
  IN p_username VARCHAR(100),
  IN p_password VARCHAR(255),
  IN p_nama_lengkap VARCHAR(150),
  IN p_nomor_hp VARCHAR(30),
  IN p_email VARCHAR(150),
  IN p_alamat TEXT,
  IN p_no_plat VARCHAR(20)
)
BEGIN
  DECLARE v_role_id INT;
  SELECT id INTO v_role_id
  FROM roles
  WHERE kode COLLATE utf8mb4_general_ci = p_role_kode COLLATE utf8mb4_general_ci
  LIMIT 1;

  IF v_role_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role tidak ditemukan';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pengguna
    WHERE username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username sudah digunakan';
  END IF;

  INSERT INTO pengguna (
    role_id, username, password_hash, nama_lengkap, nomor_hp, email, alamat, no_plat
  ) VALUES (
    v_role_id, p_username, SHA2(p_password, 256), p_nama_lengkap, p_nomor_hp, p_email, p_alamat, p_no_plat
  );
END$$

CREATE PROCEDURE sp_pengguna_update_profile(
  IN p_pengguna_id INT,
  IN p_nama_lengkap VARCHAR(150),
  IN p_nomor_hp VARCHAR(30),
  IN p_email VARCHAR(150),
  IN p_alamat TEXT,
  IN p_no_plat VARCHAR(20)
)
BEGIN
  UPDATE pengguna
  SET nama_lengkap = COALESCE(p_nama_lengkap, nama_lengkap),
      nomor_hp = COALESCE(p_nomor_hp, nomor_hp),
      email = COALESCE(p_email, email),
      alamat = COALESCE(p_alamat, alamat),
      no_plat = COALESCE(p_no_plat, no_plat)
  WHERE id = p_pengguna_id;
END$$

CREATE PROCEDURE sp_kendaraan_upsert(
  IN p_pengguna_id INT,
  IN p_no_polisi VARCHAR(20),
  IN p_merk VARCHAR(50),
  IN p_tipe VARCHAR(50),
  IN p_tahun INT,
  IN p_warna VARCHAR(30),
  IN p_nomor_rangka VARCHAR(50),
  IN p_nomor_mesin VARCHAR(50)
)
BEGIN
  IF EXISTS (SELECT 1 FROM kendaraan WHERE no_polisi = p_no_polisi) THEN
    UPDATE kendaraan
    SET pengguna_id = p_pengguna_id,
        merk = p_merk,
        tipe = p_tipe,
        tahun = p_tahun,
        warna = p_warna,
        nomor_rangka = p_nomor_rangka,
        nomor_mesin = p_nomor_mesin
    WHERE no_polisi = p_no_polisi;
  ELSE
    INSERT INTO kendaraan (
      pengguna_id, no_polisi, merk, tipe, tahun, warna, nomor_rangka, nomor_mesin
    ) VALUES (
      p_pengguna_id, p_no_polisi, p_merk, p_tipe, p_tahun, p_warna, p_nomor_rangka, p_nomor_mesin
    );
  END IF;
END$$

CREATE PROCEDURE sp_suku_cadang_upsert(
  IN p_kode_suku_cadang VARCHAR(50),
  IN p_nama_suku_cadang VARCHAR(150),
  IN p_satuan VARCHAR(30),
  IN p_stok_aktual INT,
  IN p_stok_minimum INT,
  IN p_harga_beli DECIMAL(14,2),
  IN p_harga_jual DECIMAL(14,2)
)
BEGIN
  IF EXISTS (SELECT 1 FROM suku_cadang WHERE kode_suku_cadang = p_kode_suku_cadang) THEN
    UPDATE suku_cadang
    SET nama_suku_cadang = p_nama_suku_cadang,
        satuan = p_satuan,
        stok_aktual = p_stok_aktual,
        stok_minimum = p_stok_minimum,
        harga_beli = p_harga_beli,
        harga_jual = p_harga_jual
    WHERE kode_suku_cadang = p_kode_suku_cadang;
  ELSE
    INSERT INTO suku_cadang (
      kode_suku_cadang, nama_suku_cadang, satuan, stok_aktual, stok_minimum, harga_beli, harga_jual
    ) VALUES (
      p_kode_suku_cadang, p_nama_suku_cadang, p_satuan, p_stok_aktual, p_stok_minimum, p_harga_beli, p_harga_jual
    );
  END IF;
END$$

-- =========================================================
-- STORED PROCEDURES - TRANSACTION FLOW
-- =========================================================

CREATE PROCEDURE sp_reservasi_inisiasi(
  IN p_pengguna_id INT,
  IN p_kendaraan_id INT,
  IN p_keluhan_awal TEXT,
  OUT p_reservasi_id INT
)
BEGIN
  INSERT INTO reservasi (
    kode_reservasi, pengguna_id, kendaraan_id, keluhan_awal, status
  ) VALUES (
    CONCAT('RSV-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
    p_pengguna_id,
    p_kendaraan_id,
    p_keluhan_awal,
    'MENUNGGU'
  );

  SET p_reservasi_id = LAST_INSERT_ID();
END$$

CREATE PROCEDURE sp_reservasi_penugasan_mekanik(
  IN p_reservasi_id INT,
  IN p_mekanik_id INT
)
BEGIN
  UPDATE reservasi
  SET mekanik_id = p_mekanik_id,
      status = 'DALAM_PENGECEKAN'
  WHERE id = p_reservasi_id
    AND status = 'MENUNGGU';
END$$

CREATE PROCEDURE sp_reservasi_diagnosis_mekanik(
  IN p_reservasi_id INT,
  IN p_keluhan_aktual TEXT,
  IN p_detail_json JSON,
  OUT p_total_jasa DECIMAL(14,2),
  OUT p_total_suku_cadang DECIMAL(14,2),
  OUT p_total_tagihan DECIMAL(14,2)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;

  START TRANSACTION;

  UPDATE reservasi
  SET keluhan_aktual = p_keluhan_aktual,
      status = 'MENUNGGU_PEMBAYARAN'
  WHERE id = p_reservasi_id;

  DELETE FROM detail_reservasi WHERE reservasi_id = p_reservasi_id;

  INSERT INTO detail_reservasi (
    reservasi_id, suku_cadang_id, qty, harga_satuan, subtotal, tanggal_pakai
  )
  SELECT
    p_reservasi_id,
    jt.suku_cadang_id,
    jt.qty,
    sc.harga_jual,
    (jt.qty * sc.harga_jual),
    CURRENT_DATE
  FROM JSON_TABLE(p_detail_json, '$[*]'
    COLUMNS(
      suku_cadang_id INT PATH '$.suku_cadang_id',
      qty INT PATH '$.qty'
    )
  ) jt
  JOIN suku_cadang sc ON sc.id = jt.suku_cadang_id;

  SELECT COUNT(*) INTO v_count FROM detail_reservasi WHERE reservasi_id = p_reservasi_id;

  SELECT IFNULL(SUM(subtotal), 0)
    INTO p_total_suku_cadang
  FROM detail_reservasi
  WHERE reservasi_id = p_reservasi_id;

  SET p_total_jasa = 0;
  SET p_total_tagihan = p_total_jasa + p_total_suku_cadang;

  UPDATE reservasi
  SET total_jasa = p_total_jasa,
      total_suku_cadang = p_total_suku_cadang,
      total_tagihan = p_total_tagihan
  WHERE id = p_reservasi_id;

  INSERT INTO laporan_audit(jenis_aksi, referensi_id, keterangan)
  VALUES ('DIAGNOSA', p_reservasi_id, CONCAT('Detail suku cadang: ', v_count));

  COMMIT;
END$$

CREATE PROCEDURE sp_reservasi_hitung_tagihan(
  IN p_reservasi_id INT
)
BEGIN
  SELECT
    r.id AS reservasi_id,
    r.kode_reservasi,
    r.status,
    r.keluhan_awal,
    r.keluhan_aktual,
    u.nama_lengkap AS nama_klien,
    k.no_polisi,
    m.nama_lengkap AS nama_mekanik,
    IFNULL(r.total_jasa, 0) AS total_jasa,
    IFNULL(r.total_suku_cadang, 0) AS total_suku_cadang,
    IFNULL(r.total_tagihan, 0) AS total_tagihan,
    IFNULL(SUM(dr.qty), 0) AS total_qty_suku_cadang,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'kode_suku_cadang', sc.kode_suku_cadang,
        'nama_suku_cadang', sc.nama_suku_cadang,
        'qty', dr.qty,
        'harga_satuan', dr.harga_satuan,
        'subtotal', dr.subtotal
      )
    ) AS rincian_material
  FROM reservasi r
  JOIN pengguna u ON u.id = r.pengguna_id
  JOIN kendaraan k ON k.id = r.kendaraan_id
  LEFT JOIN pengguna m ON m.id = r.mekanik_id
  LEFT JOIN detail_reservasi dr ON dr.reservasi_id = r.id
  LEFT JOIN suku_cadang sc ON sc.id = dr.suku_cadang_id
  WHERE r.id = p_reservasi_id
  GROUP BY r.id, r.kode_reservasi, r.status, r.keluhan_awal, r.keluhan_aktual, u.nama_lengkap, k.no_polisi, m.nama_lengkap, r.total_jasa, r.total_suku_cadang, r.total_tagihan;
END$$

CREATE PROCEDURE sp_pembayaran_kasir_validasi(
  IN p_reservasi_id INT,
  IN p_kasir_id INT,
  IN p_metode_pembayaran VARCHAR(10),
  IN p_jumlah_bayar DECIMAL(14,2)
)
BEGIN
  DECLARE v_suku_id INT DEFAULT 0;
  DECLARE v_qty INT DEFAULT 0;
  DECLARE v_total_tagihan DECIMAL(14,2) DEFAULT 0;
  DECLARE v_kembali DECIMAL(14,2) DEFAULT 0;
  DECLARE v_done INT DEFAULT 0;

  DECLARE cur_detail CURSOR FOR
    SELECT suku_cadang_id, qty
    FROM detail_reservasi
    WHERE reservasi_id = p_reservasi_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT total_tagihan INTO v_total_tagihan
  FROM reservasi
  WHERE id = p_reservasi_id
    AND status = 'MENUNGGU_PEMBAYARAN'
  FOR UPDATE;

  IF v_total_tagihan IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reservasi tidak valid untuk pembayaran';
  END IF;

  IF p_jumlah_bayar < v_total_tagihan THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah bayar kurang dari total tagihan';
  END IF;

  SET v_kembali = p_jumlah_bayar - v_total_tagihan;

  OPEN cur_detail;
  read_loop: LOOP
    FETCH cur_detail INTO v_suku_id, v_qty;
    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;

    UPDATE suku_cadang
    SET stok_aktual = stok_aktual - v_qty
    WHERE id = v_suku_id
      AND stok_aktual >= v_qty;

    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stok tidak mencukupi';
    END IF;
  END LOOP;
  CLOSE cur_detail;

  UPDATE reservasi
  SET status = 'LUNAS',
      tanggal_pembayaran = NOW()
  WHERE id = p_reservasi_id;

  INSERT INTO pembayaran (
    reservasi_id, kasir_id, metode_pembayaran, jumlah_bayar, jumlah_kembali, status_bayar
  ) VALUES (
    p_reservasi_id, p_kasir_id, p_metode_pembayaran, p_jumlah_bayar, v_kembali, 'VALID'
  );

  INSERT INTO laporan_audit(jenis_aksi, referensi_id, keterangan)
  VALUES ('PEMBAYARAN', p_reservasi_id, CONCAT('Kembali: ', v_kembali));

  COMMIT;
END$$

-- =========================================================
-- STORED PROCEDURES - REPORTS (ROLE-BASED)
-- =========================================================

CREATE PROCEDURE sp_laporan_pendapatan_harian(
  IN p_tanggal DATE
)
BEGIN
  SELECT
    DATE(r.tanggal_pembayaran) AS tanggal_operasional,
    COUNT(*) AS total_transaksi,
    SUM(r.total_tagihan) AS total_pendapatan
  FROM reservasi r
  WHERE r.status = 'LUNAS'
    AND DATE(r.tanggal_pembayaran) = COALESCE(p_tanggal, CURRENT_DATE)
  GROUP BY DATE(r.tanggal_pembayaran);
END$$

CREATE PROCEDURE sp_laporan_peringkat_konsumsi_suku_cadang()
BEGIN
  SELECT
    sc.kode_suku_cadang,
    sc.nama_suku_cadang,
    SUM(dr.qty) AS total_konsumsi
  FROM suku_cadang sc
  JOIN detail_reservasi dr ON dr.suku_cadang_id = sc.id
  GROUP BY sc.kode_suku_cadang, sc.nama_suku_cadang
  ORDER BY total_konsumsi DESC, sc.nama_suku_cadang ASC;
END$$

CREATE PROCEDURE sp_laporan_kinerja_diagnosis_mekanik()
BEGIN
  SELECT
    m.id AS mekanik_id,
    m.username,
    m.nama_lengkap,
    COUNT(r.id) AS total_reservasi_ditugaskan,
    SUM(CASE WHEN r.status = 'MENUNGGU_PEMBAYARAN' OR r.status = 'LUNAS' THEN 1 ELSE 0 END) AS total_diagnosis_selesai
  FROM pengguna m
  JOIN roles ro ON ro.id = m.role_id
  LEFT JOIN reservasi r ON r.mekanik_id = m.id
  WHERE ro.kode = 'MECH'
  GROUP BY m.id, m.username, m.nama_lengkap
  ORDER BY total_diagnosis_selesai DESC, total_reservasi_ditugaskan DESC;
END$$

CREATE PROCEDURE sp_laporan_riwayat_servis_klien(
  IN p_pengguna_id INT
)
BEGIN
  SELECT
    r.kode_reservasi,
    r.status,
    r.keluhan_awal,
    r.keluhan_aktual,
    r.total_tagihan,
    r.dibuat_pada,
    r.tanggal_pembayaran,
    k.no_polisi,
    k.merk,
    k.tipe,
    k.tahun,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'kode_suku_cadang', sc.kode_suku_cadang,
        'nama_suku_cadang', sc.nama_suku_cadang,
        'qty', dr.qty,
        'subtotal', dr.subtotal
      )
    ) AS detail_material
  FROM reservasi r
  JOIN kendaraan k ON k.id = r.kendaraan_id
  LEFT JOIN detail_reservasi dr ON dr.reservasi_id = r.id
  LEFT JOIN suku_cadang sc ON sc.id = dr.suku_cadang_id
  WHERE r.pengguna_id = p_pengguna_id
  GROUP BY r.id, r.kode_reservasi, r.status, r.keluhan_awal, r.keluhan_aktual, r.total_tagihan, r.dibuat_pada, r.tanggal_pembayaran, k.no_polisi, k.merk, k.tipe, k.tahun
  ORDER BY r.dibuat_pada DESC;
END$$

CREATE PROCEDURE sp_laporan_defisit_stok_harian()
BEGIN
  SELECT
    sc.kode_suku_cadang,
    sc.nama_suku_cadang,
    sc.stok_aktual,
    sc.stok_minimum,
    COALESCE(SUM(dr.qty), 0) AS volume_konsumsi_hari_ini
  FROM suku_cadang sc
  LEFT JOIN detail_reservasi dr
    ON dr.suku_cadang_id = sc.id
   AND dr.tanggal_pakai = CURRENT_DATE
  GROUP BY sc.id, sc.kode_suku_cadang, sc.nama_suku_cadang, sc.stok_aktual, sc.stok_minimum
  HAVING sc.stok_aktual <= sc.stok_minimum
  ORDER BY volume_konsumsi_hari_ini DESC, sc.nama_suku_cadang ASC;
END$$

DELIMITER ;

-- =========================================================
-- DAFTAR TABEL YANG DIGUNAKAN
-- =========================================================
-- Sesuai permintaan inti:
-- 1. pengguna
-- 2. kendaraan
-- 3. suku_cadang
-- 4. reservasi
-- 5. detail_reservasi
-- Tambahan pendukung yang perlu:
-- 6. roles            -> pemisahan hak akses
-- 7. pembayaran       -> pencatatan pelunasan/transaksi kasir
-- 8. laporan_audit    -> jejak audit aksi bisnis
