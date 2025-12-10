export class Pause {
    constructor(
        public id: string | null,
        public recurrentAppointmentId: string,
        public pauseStartDate: Date,
        public pauseEndDate: Date,
        public createdAt: Date = new Date()
    ) {}

    static create(recurrentAppointmentId: string, startDate: Date, endDate: Date): Pause {
        return new Pause(
            null,
            recurrentAppointmentId,
            startDate,
            endDate
        );
    }

    isValid(): boolean {
        return Boolean(this.recurrentAppointmentId && this.pauseStartDate && this.pauseEndDate);
    }
}
