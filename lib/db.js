// lib/db.js

const mysql = require('mysql2/promise');

if (process.env.NODE_ENV === 'production') {
  console.log(`Connecting to DB: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, 
  },
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
});

module.exports = pool;