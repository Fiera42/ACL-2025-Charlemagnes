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
    private static appointmentService: IAppointmentService;
    private static calendarService: ICalendarService;

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

    private static initializeAppointmentService(): void {
        if(!this.appointmentService) {
            this.initializeDatabases();
            this.appointmentService = new AppointmentService(this.calendarDB);
        }
    }

    private static initializeCalendarService(): void {
        if(!this.calendarService) {
            this.initializeDatabases();
            this.calendarService = new CalendarService(this.calendarDB, this.authDB);
        }
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

    static getCalendarService(): ICalendarService {
        this.initializeCalendarService();
        return this.calendarService;
    }

    static getAppointmentService(): IAppointmentService {
        this.initializeAppointmentService();
        return this.appointmentService;
    }
}