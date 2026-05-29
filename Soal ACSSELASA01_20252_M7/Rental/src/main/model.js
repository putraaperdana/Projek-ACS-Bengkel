import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export const getDoctors = async (event, searchName = '') => {
   const [[result]] = await pool.query("CALL get_doctors(?)", [searchName]);
   return result;
};

export const getDoctorReport = async (event, doctorId) => {
   const [[header]] = await pool.query("CALL get_doctor_info(?)", [doctorId]);
   const [[checkups]] = await pool.query("CALL get_doctor_checkups(?)", [doctorId]);
   const [[prescriptions]] = await pool.query("CALL get_doctor_prescriptions(?)", [doctorId]);

   return {
      header: header[0],
      checkups: checkups,
      prescriptions: prescriptions
   };
};

export const getMedicineReport = async (event, medicineCode) => {
   const [[info]] = await pool.query("CALL get_medicine_info(?)", [medicineCode]);
   const [[chartData]] = await pool.query("CALL get_medicine_chart(?)", [medicineCode]);

   return {
      info: info[0],
      chartData: chartData
   };
};