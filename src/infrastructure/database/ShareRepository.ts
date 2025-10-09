import { IShareDB } from '../../domain/interfaces/IShareDB';
import { Share } from '../../domain/entities/Share';
import { ShareType } from '../../domain/entities/ShareType';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ShareRepository implements IShareDB {
    async createShare(share: Share): Promise<Share> {
        const id = uuidv4();
        await pool.execute<ResultSetHeader>(
            'INSERT INTO shares (id, owner_id, calendar_id, user_share_id, type_share, link_share, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, share.ownerId, share.calendarId, share.userShareId, share.typeShare, share.linkShare, share.createdAt]
        );

        return new Share(id, share.ownerId, share.calendarId, share.userShareId, share.typeShare, share.linkShare, share.createdAt);
    }

    async findShareById(id: string): Promise<Share | null> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM shares WHERE id = ?',
            [id]
        );

        if (rows.length === 0) return null;

        const row = rows[0];
        return new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share as ShareType,
            row.link_share,
            new Date(row.created_at)
        );
    }

    async findSharesByCalendarId(calendarId: string): Promise<Share[]> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM shares WHERE calendar_id = ?',
            [calendarId]
        );

        return rows.map(row => new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share as ShareType,
            row.link_share,
            new Date(row.created_at)
        ));
    }

    async findSharesByUserId(userId: string): Promise<Share[]> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM shares WHERE user_share_id = ?',
            [userId]
        );

        return rows.map(row => new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share as ShareType,
            row.link_share,
            new Date(row.created_at)
        ));
    }

    async findSharesByOwner(ownerId: string): Promise<Share[]> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM shares WHERE owner_id = ?',
            [ownerId]
        );

        return rows.map(row => new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share as ShareType,
            row.link_share,
            new Date(row.created_at)
        ));
    }

    async deleteShare(id: string): Promise<boolean> {
        const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM shares WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }
}
