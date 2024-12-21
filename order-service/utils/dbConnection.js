import mysql from 'mysql2'

const pool = mysql.createPool({
  host: 'mysqlservice',
  user: 'mysql',
  database: 'orderService',
  password: 'admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default pool.promise()
