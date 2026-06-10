const mysql = require('mysql2/promise')
import dotenv from 'dotenv'

dotenv.config()
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10
})

/* Student-related procedures removed: getStudents, getStudentReport */

// New methods for maintenance system
export const completeRepair = async (event, payload) => {
  const { id_log, odometer_baru, components } = payload
  const compJson = JSON.stringify(components || [])
  try {
    const [rows] = await pool.query('CALL SP_SelesaikanPerbaikan(?,?,?)', [
      id_log,
      odometer_baru,
      compJson
    ])
    return { success: true }
  } catch (err) {
    // throw to be handled by renderer for toast display
    throw new Error(err.sqlMessage || err.message || 'Database error')
  }
}

export const getKendaraan = async () => {
  const [resultSets] = await pool.query('CALL SP_GetKendaraan()')
  // mysql2 returns resultSets where first element is the rows array
  return Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
}

export const getCategories = async () => {
  const [resultSets] = await pool.query('CALL SP_GetCategories()')
  const rows =
    Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
  return rows.map((r) => r.kategori)
}

export const addSukuCadang = async (event, payload) => {
  const { nama, kategori, kuantitas_fisik, batas_minimum } = payload
  try {
    const [res] = await pool.query(
      'INSERT INTO Suku_Cadang (nama,kategori,kuantitas_fisik,batas_minimum) VALUES (?,?,?,?)',
      [nama, kategori, kuantitas_fisik || 0, batas_minimum || 0]
    )
    return { success: true, insertId: res.insertId }
  } catch (err) {
    throw new Error(err.sqlMessage || err.message || 'DB insert error')
  }
}

export const addKendaraan = async (event, payload) => {
  const { nomor_polisi, tahun, odometer, status } = payload
  try {
    const [res] = await pool.query(
      'INSERT INTO Kendaraan_Operasional (nomor_polisi,tahun,odometer,status) VALUES (?,?,?,?)',
      [nomor_polisi, tahun || null, odometer || 0, status || 'Aktif']
    )
    return { success: true, insertId: res.insertId }
  } catch (err) {
    throw new Error(err.sqlMessage || err.message || 'DB insert error')
  }
}

export const updateKendaraanStatus = async (event, payload) => {
  const { nomor_polisi, status } = payload
  try {
    await pool.query('CALL SP_UpdateKendaraanStatus(?,?)', [nomor_polisi, status])
    return { success: true }
  } catch (err) {
    throw new Error(err.sqlMessage || err.message || 'DB update error')
  }
}

export const getMechanics = async () => {
  const [resultSets] = await pool.query('CALL SP_GetMechanics()')
  return Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
}

export const getKendaraanForMekanik = async (event, id_user) => {
  const [resultSets] = await pool.query('CALL SP_GetKendaraanForMekanik(?)', [id_user])
  return Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
}

export const getAssignedRepairByVehicle = async (event, payload) => {
  const { nomor_polisi, id_user } = payload
  const [resultSets] = await pool.query('CALL SP_GetAssignedRepairByVehicle(?,?)', [nomor_polisi, id_user])
  const rows = Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
  return rows && rows.length > 0 ? rows[0] : null
}

export const assignRepair = async (event, payload) => {
  const { nomor_polisi, id_mekanik, id_assigned_by } = payload
  try {
    await pool.query('CALL SP_AssignRepairToMekanik(?,?,?)', [nomor_polisi, id_mekanik, id_assigned_by])
    return { success: true }
  } catch (err) {
    throw new Error(err.sqlMessage || err.message || 'DB assign error')
  }
}

export const addLogPerbaikan = async (event, payload) => {
  const { nomor_polisi, id_mekanik } = payload
  try {
    const [res] = await pool.query(
      'INSERT INTO Log_Perbaikan (nomor_polisi,id_mekanik,tanggal,status) VALUES (?,?,NOW(),?)',
      [nomor_polisi, id_mekanik || null, 'Diperbaiki']
    )
    // Also set kendaraan status to Diperbaiki
    await pool.query('UPDATE Kendaraan_Operasional SET status = ? WHERE nomor_polisi = ?', [
      'Diperbaiki',
      nomor_polisi
    ])
    return { success: true, insertId: res.insertId }
  } catch (err) {
    throw new Error(err.sqlMessage || err.message || 'DB insert error')
  }
}

export const deleteKendaraan = async (event, nomor_polisi) => {
  try {
    const [res] = await pool.query('DELETE FROM Kendaraan_Operasional WHERE nomor_polisi = ?', [
      nomor_polisi
    ])
    if (res.affectedRows === 0) throw new Error('Kendaraan tidak ditemukan')
    return { success: true }
  } catch (err) {
    // Foreign key restriction or other sql errors
    if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new Error(
        'Kendaraan memiliki referensi log perbaikan; hapus atau batalkan log terlebih dahulu'
      )
    }
    throw new Error(err.sqlMessage || err.message || 'DB delete error')
  }
}

export const getSukuByKategori = async (event, kategori) => {
  const [resultSets] = await pool.query('CALL SP_GetSukuByKategori(?)', [kategori])
  return Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
}

export const getReports = async () => {
  const reports = {}
  const [resultSets] = await pool.query('CALL SP_GetReports()')
  // resultSets will be an array of result sets; map accordingly
  reports.kesiapan_armada = resultSets[0] || []
  reports.defisit_inventaris = resultSets[1] || []
  reports.frekuensi_kerusakan = resultSets[2] || []
  reports.distribusi_penugasan = resultSets[3] || []
  reports.konsumsi_komponen = resultSets[4] || []
  return reports
}

export const login = async (event, username, password) => {
  try {
    const [resultSets] = await pool.query('CALL SP_LoginUser(?,?)', [username, password])
    const rows =
      Array.isArray(resultSets) && Array.isArray(resultSets[0]) ? resultSets[0] : resultSets
    if (!rows || rows.length === 0) {
      throw new Error('Invalid username or password')
    }
    return rows[0]
  } catch (err) {
    throw new Error(err.sqlMessage || err.message || 'Login error')
  }
}
