export interface IShareService {
    createShareForUser(ownerId: string, calendarId: string, userShareId: string): Promise<void>;
    removeShareForUser(ownerId: string, calendarId: string, userShareId: string): Promise<void>;
    getSharedCalendarsForUser(userShareId: string): Promise<{ calendarId: string; ownerId: string }[]>;
    getSharesByCalendarId(ownerId: string, calendarId: string): Promise<{ id: string; userShareId: string }[]>;
}