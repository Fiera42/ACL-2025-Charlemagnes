import { Appointment } from "./Appointment";
import { RecursionRule } from "./RecursionRule";

export class RecurrentAppointment extends Appointment {
    constructor(
    public id: string | null,
    public calendarId: string,
    public title: string,
    public description: string,
    public startDate: Date,
    public endDate: Date,
    public createdAt: Date = new Date(),
    public recursionRule: RecursionRule = RecursionRule.WEEKLY,
  ) {
    super(id, calendarId, title, description, startDate, endDate, createdAt)
  }

  static createRecurrent(
    calendarId: string,
    title: string,
    description: string,
    startDate: Date,
    endDate: Date,
    recursionRule: RecursionRule
  ): RecurrentAppointment {
    return new RecurrentAppointment(null, calendarId, title, description, startDate, endDate, undefined, recursionRule);
  }
}