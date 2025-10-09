import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'calendar_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export async function initDatabase(): Promise<void> {
  try {
    const connection = await pool.getConnection();

    // Create tables
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);

    await connection.execute(`
      ALTER TABLE calendars 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36),
      ADD FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    await connection.execute(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS owner_id VARCHAR(36) NOT NULL,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36),
      ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      ADD FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shares (
        id VARCHAR(36) PRIMARY KEY,
        owner_id VARCHAR(36) NOT NULL,
        calendar_id VARCHAR(36) NOT NULL,
        user_share_id VARCHAR(36) NOT NULL,
        type_share TINYINT NOT NULL,
        link_share VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
        FOREIGN KEY (user_share_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}