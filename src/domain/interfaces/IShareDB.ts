import { Share } from '../entities/Share';

export interface IShareDB {
    createShare(share: Share): Promise<Share>;
    findShareById(id: string): Promise<Share | null>;
    findSharesByCalendarId(calendarId: string): Promise<Share[]>;
    findSharesByUserId(userId: string): Promise<Share[]>;
    findSharesByOwner(ownerId: string): Promise<Share[]>;
    deleteShare(id: string): Promise<boolean>;
}
