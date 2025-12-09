import {IShareService} from "../../domain/interfaces/IShareService";
import {IShareDB} from "../../domain/interfaces/IShareDB";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {Share} from "../../domain/entities/Share";
import {ShareType} from "../../domain/entities/ShareType";
import {Sanitizer} from "./utils/Sanitizer";

export class ShareService implements IShareService {
    constructor(
        private shareDB: IShareDB,
        private calendarDB: ICalendarDB
    ) {
    }

    async createShareForUser(
        ownerId: string,
        calendarId: string,
        userShareId: string
    ): Promise<void> {
        this.validateId("ownerId", ownerId);
        this.validateId("calendarId", calendarId);
        this.validateId("userShareId", userShareId);

        if (ownerId === userShareId) {
            throw new Error("Cannot share calendar with yourself");
        }

        const calendar = await this.calendarDB.findCalendarById(calendarId);
        if (!calendar) {
            throw new Error(`Calendar with id ${calendarId} not found`);
        }

        if (calendar.ownerId !== ownerId) {
            throw new Error(`User ${ownerId} does not own calendar ${calendarId}`);
        }

        const existingShares = await this.shareDB.findSharesByCalendarId(calendarId);
        const alreadyShared = existingShares.find(s => s.userShareId === userShareId);
        if (alreadyShared) {
            throw new Error(`Calendar already shared with user ${userShareId}`);
        }

        const share = Share.create(
            ownerId,
            calendarId,
            userShareId,
            ShareType.LINK,
            null
        );

        await this.shareDB.createShare(share);
    }

    async removeShareForUser(
        ownerId: string,
        calendarId: string,
        userShareId: string
    ): Promise<void> {
        this.validateId("ownerId", ownerId);
        this.validateId("calendarId", calendarId);
        this.validateId("userShareId", userShareId);

        const calendar = await this.calendarDB.findCalendarById(calendarId);
        if (!calendar) {
            throw new Error(`Calendar with id ${calendarId} not found`);
        }

        if (calendar.ownerId !== ownerId) {
            throw new Error(`User ${ownerId} does not own calendar ${calendarId}`);
        }

        const shares = await this.shareDB.findSharesByCalendarId(calendarId);
        const shareToDelete = shares.find(s => s.userShareId === userShareId);

        if (!shareToDelete) {
            throw new Error(`Share not found for user ${userShareId} on calendar ${calendarId}`);
        }

        await this.shareDB.deleteShare(shareToDelete.id!);
    }

    async getSharedCalendarsForUser(
        userShareId: string
    ): Promise<{ calendarId: string; ownerId: string }[]> {
        this.validateId("userShareId", userShareId);

        const shares = await this.shareDB.findSharesByUserId(userShareId);

        return shares.map(share => ({
            calendarId: share.calendarId,
            ownerId: share.ownerId
        }));
    }

    async getSharesByCalendarId(
        ownerId: string,
        calendarId: string
    ): Promise<{ id: string; userShareId: string }[]> {
        this.validateId("ownerId", ownerId);
        this.validateId("calendarId", calendarId);

        const calendar = await this.calendarDB.findCalendarById(calendarId);
        if (!calendar) {
            throw new Error(`Calendar with id ${calendarId} not found`);
        }

        if (calendar.ownerId !== ownerId) {
            throw new Error(`User ${ownerId} does not own calendar ${calendarId}`);
        }

        const shares = await this.shareDB.findSharesByCalendarId(calendarId);

        return shares.map(share => ({
            id: share.id!,
            userShareId: share.userShareId
        }));
    }

    async acceptShareByCalendarId(
        calendarId: string,
        userShareId: string
    ): Promise<void> {
        this.validateId("calendarId", calendarId);
        this.validateId("userShareId", userShareId);

        const calendar = await this.calendarDB.findCalendarById(calendarId);
        if (!calendar) {
            throw new Error(`Calendar with id ${calendarId} not found`);
        }

        if (calendar.ownerId === userShareId) {
            throw new Error("Cannot share calendar with yourself");
        }

        const existingShares = await this.shareDB.findSharesByCalendarId(calendarId);
        const alreadyShared = existingShares.find(s => s.userShareId === userShareId);
        if (alreadyShared) {
            throw new Error("Calendar already shared with you");
        }

        const share = Share.create(
            calendar.ownerId,
            calendarId,
            userShareId,
            ShareType.LINK,
            null
        );

        await this.shareDB.createShare(share);
    }

    async deleteShareById(
        ownerId: string,
        shareId: string
    ): Promise<boolean> {
        this.validateId("ownerId", ownerId);
        this.validateId("shareId", shareId);

        const share = await this.shareDB.findShareById(shareId);
        if (!share) {
            throw new Error(`Share with id ${shareId} not found`);
        }

        if (share.ownerId !== ownerId && share.userShareId !== ownerId) {
            throw new Error(`User ${ownerId} cannot delete this share`);
        }

        return await this.shareDB.deleteShare(shareId);
    }

    private validateId(fieldName: string, id: string): void {
        if (!id || id.trim().length === 0) {
            throw new Error(`${fieldName} cannot be empty`);
        }

        if (Sanitizer.doesStringContainSpecialChar(id)) {
            throw new Error(`${fieldName} (${id}) contains special characters`);
        }
    }
}