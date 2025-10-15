import {Appointment} from "../../domain/entities/Appointment";
import {Calendar} from "../../domain/entities/Calendar";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";

export class MockCalendarDB implements ICalendarDB {
    calendars: { [id: string]: Calendar } = {};
    appointments: { [id: string]: Appointment } = {};
    maxCalendarId: string = "0";
    maxAppointmentId: string = "0";

    incrementID(input: string): string {
        const count = input.match(/([0-8]|9)9*$/);

        if (count === null) {
            input = "0";
            return input;
        }

        const index = count?.index as number;

        input = input.substring(0, index) + (Number(count[1]) + 1) + input.substring(index + 1, input.length)
        return input;
    }

    createCalendar(calendar: Calendar): Promise<Calendar> {
        return new Promise<Calendar>((resolve) => {
            this.maxCalendarId = this.incrementID(this.maxCalendarId);

            let copy = structuredClone(calendar);
            copy.id = this.maxCalendarId;

            this.calendars[copy.id] = copy;

            resolve(structuredClone(copy));
            return;
        });
    }

    findCalendarById(id: string): Promise<Calendar | null> {
        return new Promise<Calendar | null>((resolve) => {
            if (id in this.calendars) resolve(structuredClone(this.calendars[id]));
            else resolve(null);
        });
    }

    findCalendarsByOwnerId(ownerId: string): Promise<Calendar[]> {
        return new Promise<Calendar[]>((resolve) => {
            resolve(
                Object.values(this.calendars).filter((calendar) => calendar.ownerId === ownerId)
                    .map((calendar) => structuredClone(calendar))
            );
        });
    }

    updateCalendar(id: string, calendar: Partial<Calendar>): Promise<Calendar> {
        return new Promise<Calendar>((resolve, reject) => {
            if (id in this.calendars) {
                Object.assign(this.calendars[id], calendar);
                resolve(structuredClone(this.calendars[id]));
            } else reject(new Error(`Calendar of id ${id} does not exist`));
        });
    }

    deleteCalendar(id: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (id in this.calendars) {
                delete this.calendars[id];
                resolve(true);
            } else resolve(false);
        });
    }

    createAppointment(appointment: Appointment): Promise<Appointment> {
        return new Promise<Appointment>((resolve, reject) => {
            if (!(appointment.calendarId in this.calendars)) {
                reject(new Error(`calendar of id ${appointment.calendarId} does not exist`));
                return;
            } else if (this.calendars[appointment.calendarId].ownerId !== appointment.ownerId) {
                reject(
                    new Error(
                        `ownerID of appointment (${
                            appointment.ownerId
                        }) does not match calendar ownID (${
                            this.calendars[appointment.calendarId].ownerId
                        })`
                    )
                );
                return;
            }
            this.maxAppointmentId = this.incrementID(this.maxAppointmentId);

            let copy = structuredClone(appointment);
            copy.id = this.maxAppointmentId;

            this.appointments[copy.id] = copy;

            resolve(structuredClone(copy));
        });
    }

    findAppointmentById(id: string): Promise<Appointment | null> {
        return new Promise<Appointment | null>((resolve) => {
            if (id in this.appointments) resolve(structuredClone(this.appointments[id]));
            else resolve(null);
        });
    }

    findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
        return new Promise<Appointment[]>((resolve) => {
            resolve(
                Object.values(this.appointments).filter(
                    (appointment) => appointment.calendarId === calendarId
                ).map((appointment) => structuredClone(appointment))
            );
        });
    }

    updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
        return new Promise<Appointment>((resolve, reject) => {
            if (id in this.appointments) {
                Object.assign(this.appointments[id], appointment);
                resolve(structuredClone(this.appointments[id]));
            } else reject(new Error(`Appointment of id ${id} does not exist`));
        });
    }

    deleteAppointment(id: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (id in this.appointments) {
                delete this.appointments[id];
                resolve(true);
            } else resolve(false);
        });
    }

    reset() {
        this.calendars = {};
        this.appointments = {};
        this.maxCalendarId = "0";
        this.maxAppointmentId = "0";
    }
}
