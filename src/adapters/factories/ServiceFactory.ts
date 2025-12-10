import { IAuthDB } from '../../domain/interfaces/IAuthDB';
import { ICalendarDB } from '../../domain/interfaces/ICalendarDB';
import { IShareDB } from '../../domain/interfaces/IShareDB';
import { ITagDB } from '../../domain/interfaces/ITagDB';
import { IPauseDB } from "../../domain/interfaces/IPauseDB";
import { IAppointmentService } from '../../domain/interfaces/IAppointmentService';
import { ICalendarService } from '../../domain/interfaces/ICalendarService';
import { IAuthService } from "../../domain/interfaces/IAuthService.ts";
import { ITagService } from '../../domain/interfaces/ITagService';
import { IPauseService } from "../../domain/interfaces/IPauseService";
import {IShareService} from '../../domain/interfaces/IShareService';
import { AppointmentService } from '../../application/services/AppointmentService';
import { CalendarService } from '../../application/services/CalendarService';
import {AuthService} from "../../application/services/AuthService.ts";
import { TagService } from '../../application/services/TagService';
import { PauseService } from "../../application/services/PauseService";
import {ShareService} from '../../application/services/ShareService';
import { SQLiteAuthDB } from '../../infrastructure/database/SQLiteAuthDB';
import { SQLiteCalendarDB } from '../../infrastructure/database/SQLiteCalendarDB';
import { SQLiteShareDB } from '../../infrastructure/database/SQLiteShareDB';
import { SQLiteTagDB } from '../../infrastructure/database/SQLiteTagDB';
import { SQLitePauseDB } from '../../infrastructure/database/SQLitePauseDB';
import { db } from '../../infrastructure/config/sqliteAdapter';


export class ServiceFactory {
    private static authDB: IAuthDB;
    private static calendarDB: ICalendarDB;
    private static shareDB: IShareDB;
    private static tagDB: ITagDB;
    private static pauseDB: IPauseDB;
    private static authService: AuthService;
    private static calendarService: ICalendarService;
    private static appointmentService: IAppointmentService;
    private static tagService: ITagService;
    private static pauseService: IPauseService;
    private static shareService: IShareService;

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
        if (!this.tagDB) {
            this.tagDB = new SQLiteTagDB(db);
        }
        if (!this.pauseDB) {
            this.pauseDB = new SQLitePauseDB(db);
        }
    }

    private static initializeAppointmentService(): void {
        if (!this.appointmentService) {
            this.initializeDatabases();
            this.appointmentService = new AppointmentService(this.calendarDB, this.tagDB);
        }
    }

    private static initializeCalendarService(): void {
        if (!this.calendarService) {
            this.initializeDatabases();
            this.calendarService = new CalendarService(this.calendarDB, this.authDB);
        }
    }

    private static initializeAuthService(): void {
        if (!this.authService) {
            this.initializeDatabases();
            this.authService = new AuthService(this.authDB);
        }
    }

    private static initializeTagService(): void {
        if (!this.tagService) {
            this.initializeDatabases();
            this.tagService = new TagService(this.tagDB);
        }
    }

    private static initializePauseService(): void {
        if (!this.pauseService) {
            this.initializeDatabases();
            this.pauseService = new PauseService(this.pauseDB);
        }
    }

    private static initializeShareService(): void {
        if (!this.shareService) {
            this.initializeDatabases();
            this.shareService = new ShareService(this.shareDB, this.calendarDB);
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

    static getTagDB(): ITagDB {
        this.initializeDatabases();
        return this.tagDB;
    }

    static getPauseDB(): IPauseDB {
        this.initializeDatabases();
        return this.pauseDB;
    }

    static getCalendarService(): ICalendarService {
        this.initializeCalendarService();
        return this.calendarService;
    }

    static getAppointmentService(): IAppointmentService {
        this.initializeAppointmentService();
        return this.appointmentService;
    }

    static getAuthService(): IAuthService {
        this.initializeAuthService();
        return this.authService;
    }

    static getTagService(): ITagService {
        this.initializeTagService();
        return this.tagService;
    }

    static getShareService(): IShareService {
        this.initializeShareService();
        return this.shareService;
    }

    static getPauseService(): IPauseService {
        this.initializePauseService();
        return this.pauseService;
    }
}