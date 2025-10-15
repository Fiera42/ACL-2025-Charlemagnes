import { ShareType } from './ShareType';

export class Share {
    constructor(
        public id: string | null,
        public ownerId: string,
        public calendarId: string,
        public userShareId: string,
        public typeShare: ShareType,
        public linkShare: string | null,
        public createdAt: Date = new Date()
    ) {}

    static create(
        ownerId: string,
        calendarId: string,
        userShareId: string,
        typeShare: ShareType,
        linkShare: string | null = null
    ): Share {
        return new Share(null, ownerId, calendarId, userShareId, typeShare, linkShare);
    }

    isValid(): boolean {
        return Boolean(this.ownerId && this.calendarId && this.userShareId);
    }
}
