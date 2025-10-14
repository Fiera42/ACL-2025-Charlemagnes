import { IAuthDB } from '../../domain/interfaces/IAuthDB';
import { User } from '../../domain/entities/User';
import { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteAuthDB implements IAuthDB {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async createUser(user: User): Promise<User> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO users (id, username, email, password, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(id, user.username, user.email, user.password, user.createdAt.toISOString(), user.updatedAt.toISOString());

        return new User(id, user.username, user.email, user.password, user.createdAt, user.updatedAt);
    }

    async findUserByEmail(email: string): Promise<User | null> {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
        const row = stmt.get(email) as any;

        if (!row) return null;

        return new User(
            row.id,
            row.username,
            row.email,
            row.password,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }

    async findUserById(id: string): Promise<User | null> {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new User(
            row.id,
            row.username,
            row.email,
            row.password,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }

    async findUserByUsername(username: string): Promise<User | null> {
        const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
        const row = stmt.get(username) as any;

        if (!row) return null;

        return new User(
            row.id,
            row.username,
            row.email,
            row.password,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
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

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        const stmt = this.db.prepare(`
            UPDATE users SET ${updates.join(', ')} WHERE id = ?
        `);
        stmt.run(...values);

        const updatedUser = await this.findUserById(id);
        if (!updatedUser) throw new Error('Utilisateur introuvable');

        return updatedUser;
    }

    async deleteUser(id: string): Promise<boolean> {
        const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}