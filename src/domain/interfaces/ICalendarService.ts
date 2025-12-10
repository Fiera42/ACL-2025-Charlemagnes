import { Calendar } from "../entities/Calendar";
import { ServiceResponse } from "../entities/ServiceResponse.ts";

export interface ICalendarService {
  updateExternalCalendars(): unknown;
  createCalendar(
    ownerId: string,
    name: string,
    description: string,
    color: string,
    url?: string | null,
    updateRule?: number | null
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

  // import and export
  importCalendarFromUrl(userId: string, url: string , autoUpdate: boolean, updateRule: number | null): Promise<{ calendar: Calendar; appointmentsCreated: number }>;
  importCalendarFromICS(userId: string, icsContent: string, url?: string | null, updateRule?: number | null): Promise<{ calendar: Calendar; appointmentsCreated: number }>;
  exportICSCalendar(calendarId: string): Promise<string>;

  // public link
  getPublicLink(userId: string, calendarId: string): Promise<string>;
  exportPublicICSCalendar(token: string): Promise<string>;

}
