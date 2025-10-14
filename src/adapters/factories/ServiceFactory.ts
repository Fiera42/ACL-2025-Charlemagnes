import { IAuthDB } from '../../domain/interfaces/IAuthDB';
import { ICalendarDB } from '../../domain/interfaces/ICalendarDB';
import { IShareDB } from '../../domain/interfaces/IShareDB';
import { IAppointmentService } from '../../domain/interfaces/IAppointmentService';
import { ICalendarService } from '../../domain/interfaces/ICalendarService';
import { AppointmentService } from '../../application/services/AppointmentService';
import { CalendarService } from '../../application/services/CalendarService';
import { SQLiteAuthDB } from '../../infrastructure/database/SQLiteAuthDB';
import { SQLiteCalendarDB } from '../../infrastructure/database/SQLiteCalendarDB';
import { SQLiteShareDB } from '../../infrastructure/database/SQLiteShareDB';
import { db } from '../../infrastructure/config/sqliteAdapter';

export class ServiceFactory {
    private static authDB: IAuthDB;
    private static calendarDB: ICalendarDB;
    private static shareDB: IShareDB;

    private static initializeDatabases(): void {
        if (!this.authDB) {
            this.authDB = new SQLiteAuthDB(db);
        }
        if (!this.calendarDB) {
            this.calendarDB = new SQLiteCalendarDB(db);
        }
        if (!this.shareDB) {
            this.shareDB = new SQLiteShareDB(db);
        }
    }

    static createAppointmentService(): IAppointmentService {
        this.initializeDatabases();
        return new AppointmentService(this.calendarDB);
    }

    static createCalendarService(): ICalendarService {
        this.initializeDatabases();
        return new CalendarService(this.calendarDB, this.authDB);
    }

    static getAuthDB(): IAuthDB {
        this.initializeDatabases();
        return this.authDB;
    }

    static getCalendarDB(): ICalendarDB {
        this.initializeDatabases();
        return this.calendarDB;
    }

    static getShareDB(): IShareDB {
        this.initializeDatabases();
        return this.shareDB;
    }
}