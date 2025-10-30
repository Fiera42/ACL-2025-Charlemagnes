import { Calendar } from "../entities/Calendar";
import { ServiceResponse } from "../entities/ServiceResponse.ts";

export interface ICalendarService {
  createCalendar(
    ownerId: string,
    name: string,
    description: string,
    color: string,
  ): Promise<Calendar>;

  deleteCalendar(ownerId: string, calendarId: string): Promise<ServiceResponse>;

  updateCalendar(
    ownerId: string,
    calendarId: string,
    calendar: Partial<Calendar>
  ): Promise<ServiceResponse>;

  getCalendarById(id: string): Promise<Calendar | null>;

  getCalendarsByOwnerId(ownerId: string): Promise<Calendar[]>;

  shareCalendar(
    ownerId: string,
    calendarId: string,
    sharedToId: string
  ): Promise<ServiceResponse>;

  unShareCalendar(
    ownerId: string,
    calendarId: string,
    sharedToId: string
  ): Promise<ServiceResponse>;
}
