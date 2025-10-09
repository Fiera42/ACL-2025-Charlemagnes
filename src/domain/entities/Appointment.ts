export class Appointment {
  constructor(
    public id: string | null,
    public calendarId: string,
    public title: string,
    public description: string,
    public startDate: Date,
    public endDate: Date,
    public createdAt: Date = new Date()
  ) {}

  static create(
    calendarId: string,
    title: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Appointment {
    return new Appointment(null, calendarId, title, description, startDate, endDate);
  }

  isValid(): boolean {
    return Boolean(this.calendarId && this.title && this.startDate);
  }
}