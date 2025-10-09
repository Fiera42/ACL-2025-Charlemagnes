import { IAuthDB } from '../../domain/interfaces/IAuthDB';
import { User } from '../../domain/entities/User';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class AuthRepository implements IAuthDB {
  async createUser(user: User): Promise<User> {
    const id = uuidv4();
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (id, username, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, user.username, user.email, user.password, user.createdAt]
    );

    return new User(id, user.username, user.email, user.password, user.createdAt);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return new User(row.id, row.username, row.email, row.password, new Date(row.created_at));
  }

  async findUserById(id: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return new User(row.id, row.username, row.email, row.password, new Date(row.created_at));
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return new User(row.id, row.username, row.email, row.password, new Date(row.created_at));
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];

    if (user.username) {
      updates.push('username = ?');
      values.push(user.username);
    }
    if (user.email) {
      updates.push('email = ?');
      values.push(user.email);
    }
    if (user.password) {
      updates.push('password = ?');
      values.push(user.password);
    }

    values.push(id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedUser = await this.findUserById(id);
    if (!updatedUser) throw new Error('Utilisateur introuvable');

    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }
}