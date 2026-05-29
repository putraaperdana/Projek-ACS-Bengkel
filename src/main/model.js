import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});


export const authenticate = async (event, username, password) => {
   // Note: seed uses SHA2; in production use bcrypt.
   const sql = `SELECT u.id, u.username, u.full_name, r.name as role
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE u.username = ? AND u.password_hash = SHA2(?,256)`;
   const [rows] = await pool.query(sql, [username, password]);
   return rows[0] || null;
};

export const listCustomers = async () => {
   // Return users who have role 'customer'
   const [rows] = await pool.query(`
     SELECT u.id, u.username, u.full_name, u.phone, u.email, u.vehicle_plate
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'customer'
     ORDER BY u.id DESC LIMIT 100
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

export const listRoles = async () => {
   const [rows] = await pool.query('SELECT * FROM roles ORDER BY id');
   return rows;
};

export const createUser = async (event, username, password, roleName = 'customer', fullName = null) => {
   // Create user with role (uses SHA2 for compatibility with seed). Returns created user record (without password).
   // Note: for production, switch to bcrypt and stronger validations.
   const conn = await pool.getConnection();
   try {
      await conn.beginTransaction();
      const [roleRows] = await conn.query('SELECT id FROM roles WHERE name = ?', [roleName]);
      let roleId;
      if (!roleRows || roleRows.length === 0) {
         const [r] = await conn.query('INSERT INTO roles (name) VALUES (?)', [roleName]);
         roleId = r.insertId;
      } else {
         roleId = roleRows[0].id;
      }

      const [exists] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
      if (exists && exists.length > 0) {
         await conn.rollback();
         return { error: 'USERNAME_EXISTS' };
      }

      const [ins] = await conn.query('INSERT INTO users (username, password_hash, role_id, full_name) VALUES (?, SHA2(?,256), ?, ?)', [username, password, roleId, fullName]);
      const userId = ins.insertId;
      await conn.commit();
      const [userRow] = await conn.query('SELECT id, username, full_name, role_id FROM users WHERE id = ?', [userId]);
      return userRow[0];
   } catch (err) {
      await conn.rollback();
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