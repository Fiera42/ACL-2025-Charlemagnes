export class Appointment {
    constructor(
        public id: string | null,
        public calendarId: string,
        public title: string,
        public description: string,
        public startDate: Date,
        public endDate: Date,
        public ownerId: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public updatedBy: string | null = null
    ) {
    }

    static create(
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date,
        ownerId: string,
        tags: string[] = []
    ): Appointment {
        return new Appointment(null, calendarId, title, description, startDate, endDate, ownerId, tags);
    }

    isValid(): boolean {
        return Boolean(this.calendarId && this.title && this.startDate && this.ownerId);
    }
}