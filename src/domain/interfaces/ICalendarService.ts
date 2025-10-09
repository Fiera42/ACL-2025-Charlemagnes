import { Calendar } from "../entities/Calendar";
import { CalendarServiceResponse } from "../entities/CalendarServiceResponse";

export interface ICalendarService {
  createCalendar(ownerId: string, name: string, description: string): Calendar;

  removeCalendar(ownerId: string, calendarId: string): CalendarServiceResponse;

  getCalendar(ownerId: string, calendarId: string): Calendar;

  getCalendarsByFilter(filter: (calendar: Calendar) => boolean): Calendar[];

  shareCalendar(
    ownerId: string,
    calendarId: string,
    sharedToId: string
  ): CalendarServiceResponse;

  unShareCalendar(
    ownerId: string,
    calendarId: string,
    sharedToId: string
  ): CalendarServiceResponse;
}
