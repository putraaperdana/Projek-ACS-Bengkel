import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const firstProcedureRow = (resultSets) => {
   if (!Array.isArray(resultSets)) return null;
   const first = resultSets[0];
   return Array.isArray(first) ? first[0] || null : null;
};


export const authenticate = async (event, username, password) => {
   const [resultSets] = await pool.query('CALL sp_auth_login(?, ?)', [username, password]);
   const row = firstProcedureRow(resultSets);
   if (!row) return null;

   return {
      id: row.pengguna_id,
      username: row.username,
      full_name: row.nama_lengkap,
      role: row.role_kode,
      role_name: row.role_nama,
      phone: row.nomor_hp,
      email: row.email,
      vehicle_plate: row.no_plat,
      is_active: row.is_active
   };
};

export const listCustomers = async () => {
    // Return users who have role 'USER' in the current schema.
   const [rows] = await pool.query(`
       SELECT p.id, p.username, p.nama_lengkap AS full_name, p.nomor_hp AS phone, p.email, p.no_plat AS vehicle_plate
       FROM pengguna p
       JOIN roles r ON r.id = p.role_id
      WHERE r.kode COLLATE utf8mb4_general_ci = 'USER' COLLATE utf8mb4_general_ci
       ORDER BY p.id DESC
       LIMIT 100
   `);
   return rows;
};

export const listParts = async () => {
   const [rows] = await pool.query('SELECT * FROM parts ORDER BY name');
   return rows;
};

export const listMechanics = async () => {
   const [rows] = await pool.query('SELECT m.id, u.username, u.full_name, m.skill FROM mechanics m JOIN users u ON u.id = m.user_id');
   return rows;
};

export const createUser = async (event, username, password, fullName = null) => {
   // Create user with role code and return the saved record.
   const conn = await pool.getConnection();
   try {
      await conn.beginTransaction();
      await conn.query('CALL sp_pengguna_create(?, ?, ?, ?, ?, ?, ?, ?)', [
         'USER',
         username,
         password,
         fullName || username,
         null,
         null,
         null,
         null
      ]);

      const [rows] = await conn.query(`
        SELECT p.id, p.username, p.nama_lengkap AS full_name, p.role_id, r.kode AS role, r.nama AS role_label
        FROM pengguna p
        JOIN roles r ON r.id = p.role_id
            WHERE p.username COLLATE utf8mb4_general_ci = ? COLLATE utf8mb4_general_ci
        LIMIT 1
      `, [username]);

      await conn.commit();
      return rows[0] || null;
   } catch (err) {
      await conn.rollback();
      if (err && (err.code === 'ER_SIGNAL_EXCEPTION' || err.errno === 1644)) {
         if (String(err.sqlMessage || err.message || '').includes('Username sudah digunakan')) {
            return { error: 'USERNAME_EXISTS' };
         }
      }
      throw err;
   } finally {
      conn.release();
   }
};

export const createWorkOrder = async (event, userId, mechanicId, partsJson) => {
   // partsJson should be a JSON string like: [{"part_id":1, "quantity":2}, ...]
   const conn = await pool.getConnection();
   try {
      await conn.beginTransaction();
   const [res] = await conn.query("INSERT INTO work_orders (code, user_id, mechanic_id, status, total_amount) VALUES (CONCAT('WO-', DATE_FORMAT(NOW(),'%Y%m%d%H%i%S')), ?, ?, 'in_progress', 0)", [userId, mechanicId]);
      const workOrderId = res.insertId;

      // Insert work_order_parts
      const parts = JSON.parse(partsJson);
      for (const p of parts) {
         const [partRow] = await conn.query('SELECT unit_price, stock_qty FROM parts WHERE id=? FOR UPDATE', [p.part_id]);
         if (!partRow[0]) throw new Error('Part not found: ' + p.part_id);
         const unitPrice = partRow[0].unit_price;
         const subtotal = unitPrice * p.quantity;
         await conn.query('INSERT INTO work_order_parts (work_order_id, part_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)', [workOrderId, p.part_id, p.quantity, unitPrice, subtotal]);
         await conn.query('UPDATE parts SET stock_qty = stock_qty - ? WHERE id = ?', [p.quantity, p.part_id]);
         await conn.query('INSERT INTO stock_transactions (part_id, change_qty, type, reference) VALUES (?,?,?,?)', [p.part_id, -p.quantity, 'out', 'WO-' + workOrderId]);
      }

      const [tot] = await conn.query('SELECT IFNULL(SUM(subtotal),0) AS total FROM work_order_parts WHERE work_order_id=?', [workOrderId]);
      const total = tot[0].total || 0;
      await conn.query('UPDATE work_orders SET total_amount=? WHERE id=?', [total, workOrderId]);
      await conn.commit();
      return { id: workOrderId };
   } catch (err) {
      await conn.rollback();
      throw err;
   } finally {
      conn.release();
   }
};