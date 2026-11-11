const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ilovegemini',
  database: process.env.DB_NAME || 'edubot_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test connection
pool.getConnection()
  .then((conn) => {
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME || 'edubot_db'}"`);
    conn.release();
  })
  .catch((err) => {
    console.error(`[DB Error] Could not connect to MySQL:`, err.message);
  });

module.exports = pool;
