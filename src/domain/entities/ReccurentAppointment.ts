import {Appointment} from "./Appointment";
import {RecursionRule} from "./RecursionRule";

export class RecurrentAppointment extends Appointment {
    constructor(
        public id: string | null,
        public calendarId: string,
        public title: string,
        public description: string,
        public startDate: Date,
        public endDate: Date,
        public ownerId: string,
        public recursionRule: RecursionRule = RecursionRule.WEEKLY,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public updatedBy: string | null = null
    ) {
        super(
            id,
            calendarId,
            title,
            description,
            startDate,
            endDate,
            ownerId,
            createdAt,
            updatedAt,
            updatedBy
        );
    }

    static createRecurrent(
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date,
        ownerId: string,
        recursionRule: RecursionRule
    ): RecurrentAppointment {
        return new RecurrentAppointment(
            null,
            calendarId,
            title,
            description,
            startDate,
            endDate,
            ownerId,
            recursionRule
        );
    }

    isValid(): boolean {
        return Boolean(
            this.calendarId &&
            this.title &&
            this.startDate &&
            this.ownerId &&
            this.recursionRule !== undefined
        );
    }
}
