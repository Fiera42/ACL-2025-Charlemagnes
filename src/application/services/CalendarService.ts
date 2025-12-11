import { Calendar } from "../../domain/entities/Calendar";
import { ServiceResponse } from "../../domain/entities/ServiceResponse"; // .ts removed for cleaner import if configured
import { ICalendarDB } from "../../domain/interfaces/ICalendarDB";
import { ICalendarService } from "../../domain/interfaces/ICalendarService";
import { Sanitizer } from "./utils/Sanitizer";
import { decode, encode } from "html-entities";
import { IAuthDB } from "../../domain/interfaces/IAuthDB";
import { Appointment } from "../../domain/entities/Appointment";
import { ICSHandler } from "./utils/ICSHandler"; // .ts removed
import { ServiceFactory } from "../../adapters/factories/ServiceFactory"; // .ts removed
import { v4 as uuidv4 } from 'uuid';

export class CalendarService implements ICalendarService {
    private calendarDB: ICalendarDB;
    private authDB: IAuthDB;

    constructor(calendarDB: ICalendarDB, authDB: IAuthDB) {
        this.calendarDB = calendarDB;
        this.authDB = authDB;
    }

    // ==========================================
    // MÉTHODES PRIVÉES (HELPERS)
    // ==========================================

    /**
     * Encode une chaîne pour le stockage sécurisé (HTML Entities).
     * @param str La chaîne à encoder
     */
    private encodeString(str: string): string {
        return encode(str, { mode: 'extensive' });
    }

    /**
     * Décode une chaîne venant de la DB.
     * @param str La chaîne à décoder
     */
    private decodeString(str: string): string {
        return decode(str);
    }

    /**
     * Applique le décodage sur les propriétés d'un calendrier récupéré de la DB.
     * NOTE: L'URL n'est PAS décodée car elle est stockée brute pour rester valide.
     * @param calendar Le calendrier brut venant de la DB
     */
    private mapToDecodedCalendar(calendar: Calendar): Calendar {
        calendar.name = this.decodeString(calendar.name);
        calendar.description = this.decodeString(calendar.description);
        calendar.color = this.decodeString(calendar.color);
        if (calendar.url) {
            calendar.url = this.decodeString(calendar.url);
        }
        if (calendar.publicToken) {
            calendar.publicToken = this.decodeString(calendar.publicToken);
        }
        return calendar;
    }

    // ==========================================
    // IMPLEMENTATION ICalendarService
    // ==========================================

    createCalendar(
        ownerId: string,
        name: string,
        description: string,
        color: string,
        url: string | null = null,
        updateRule: number | null = null
    ): Promise<Calendar> {
        return new Promise<Calendar>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }

            const user = await this.authDB.findUserById(ownerId)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return;
            if (user === null) {
                reject(new Error(`User of id (${ownerId}) does not exist`));
                return;
            }

            const encodedName = this.encodeString(name);
            const encodedDescription = this.encodeString(description);
            const encodedColor = this.encodeString(color);

            const rawUrl = url; 

            const calendar = Calendar.create(encodedName, encodedDescription, encodedColor, ownerId, rawUrl, updateRule);

            this.calendarDB.createCalendar(calendar)
                .then((createdCalendar: Calendar) => {
                    resolve(this.mapToDecodedCalendar(createdCalendar));
                })
                .catch((reason: any) => {
                    reject(reason);
                });
        });
    }

    deleteCalendar(ownerId: string, calendarId: string): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarID (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return;
            if (calendar === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== calendar.ownerId) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            const deleteResult = await this.calendarDB.deleteCalendar(calendarId)
                .catch((reason) => {
                    reject(reason);
                });
            if (deleteResult === undefined) return;

            if (deleteResult) {
                resolve(ServiceResponse.SUCCESS);
            } else {
                resolve(ServiceResponse.FAILED);
            }
        });
    }

    updateCalendar(
        ownerId: string,
        calendarId: string,
        partialCalendar: Partial<Calendar>
    ): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarID (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return;
            if (calendar === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== calendar.ownerId
                || (partialCalendar.ownerId && partialCalendar.ownerId !== calendar.ownerId)
                || (partialCalendar.id && partialCalendar.id !== calendar.id)
            ) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }
            const cleanedCalendar: Partial<Calendar> = {
                ...(partialCalendar.name && { name: this.encodeString(partialCalendar.name) }),
                ...(partialCalendar.description && { description: this.encodeString(partialCalendar.description) }),
                ...(partialCalendar.color && { color: this.encodeString(partialCalendar.color) }),
                ...(partialCalendar.url && { url: partialCalendar.url }),
                ...(partialCalendar.updateRule !== undefined && { updateRule: partialCalendar.updateRule }),
                ...(partialCalendar.publicToken && { publicToken: this.encodeString(partialCalendar.publicToken) })
            };

            const updateResult = await this.calendarDB.updateCalendar(calendarId, cleanedCalendar)
                .catch((reason) => {
                    reject(reason);
                });
            if (updateResult === undefined) return;

            if (updateResult) {
                resolve(ServiceResponse.SUCCESS);
            } else {
                resolve(ServiceResponse.FAILED);
            }
        });
    }

    getCalendarById(calendarId: string): Promise<Calendar | null> {
        return new Promise<Calendar | null>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return;
            if (calendar === null) {
                resolve(null);
                return;
            }
            resolve(this.mapToDecodedCalendar(calendar));
        });
    }

    getCalendarsByOwnerId(ownerId: string): Promise<Calendar[]> {
        return new Promise<Calendar[]>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerId (${ownerId}) contains special char`));
                return;
            }

            const calendars = await this.calendarDB.findCalendarsByOwnerId(ownerId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendars === undefined) return;

            // Décodage de toute la liste
            const decodedCalendars = calendars.map(cal => this.mapToDecodedCalendar(cal));

            resolve(decodedCalendars);
        });
    }

    shareCalendar(
        ownerId: string,
        calendarId: string,
        sharedToId: string
    ): Promise<ServiceResponse> {
        throw new Error("Method not implemented.");
    }

    unShareCalendar(
        ownerId: string,
        calendarId: string,
        sharedToId: string
    ): Promise<ServiceResponse> {
        throw new Error("Method not implemented.");
    }

    async importCalendarFromUrl(userId: string, url: string, autoUpdate: boolean, updateRule: number | null): Promise<{ calendar: Calendar; appointmentsCreated: number }> {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Impossible de récupérer le calendrier depuis l'URL: ${response.statusText}`);
            const icsContent = await response.text();

            return this.importCalendarFromICS(userId, icsContent, url, autoUpdate ? updateRule : null);
        } catch (error) {
            throw error;
        }
    }

    async importCalendarFromICS(userId: string, icsContent: string, url: string | null = null, updateRule: number | null = null): Promise<{ calendar: Calendar; appointmentsCreated: number }> {
        const { calendar: calData, appointments } = ICSHandler.parse(icsContent);

        const calendar = await this.createCalendar(
            userId,
            calData.name || 'Calendrier Importé',
            calData.description || `Importé le ${new Date().toLocaleDateString()}`,
            calData.color || '#6366f1',
            url,
            updateRule
        );

        const appointmentService = ServiceFactory.getAppointmentService();
        let appointmentsCreated = 0;

        for (const appt of appointments) {
            try {
                if (appt.recursionRule !== undefined && appt.recursionRule !== null) {
                    await appointmentService.createRecurrentAppointment(
                        userId,
                        calendar.id!,
                        appt.title || 'Sans titre',
                        appt.description || '',
                        appt.startDate,
                        appt.endDate,
                        appt.recursionRule,
                        appt.recursionEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        appt.tags || []
                    );
                } else {
                    await appointmentService.createAppointment(
                        userId,
                        calendar.id!,
                        appt.title || 'Sans titre',
                        appt.description || '',
                        appt.startDate,
                        appt.endDate,
                        appt.tags || []
                    );
                }
                appointmentsCreated++;
            } catch (e) {
                console.warn(`Erreur lors de l'import d'un rendez-vous: ${e}`);
            }
        }
        return { calendar, appointmentsCreated };
    }

    async exportICSCalendar(calendarId: string): Promise<string> {
        const calendar = await this.getCalendarById(calendarId);
        if (!calendar) throw new Error('Calendrier non trouvé');

        const appointmentService = ServiceFactory.getAppointmentService();
        const appointmentsData = await appointmentService.getAppointmentsByCalendarId(calendarId);
        const recurrentData = await appointmentService.getRecurrentAppointmentByCalendarId(calendarId);
        const allAppointments = [...appointmentsData, ...recurrentData];

        return ICSHandler.generate(calendar, allAppointments);
    }

    async getPublicLink(userId: string, calendarId: string): Promise<string> {
        const calendar = await this.getCalendarById(calendarId);
        
        if (!calendar) throw new Error("Calendrier introuvable");
        if (calendar.ownerId !== userId) throw new Error("Non autorisé");

        let token = calendar.publicToken;

        if (!token) {
            const rawToken = uuidv4();
            const encodedToken = this.encodeString(rawToken);
            
            await this.calendarDB.updatePublicToken(calendarId, encodedToken);
            token = rawToken; 
        }

        return `/api/public/calendar/${token}.ics`;
    }

    async exportPublicICSCalendar(token: string): Promise<string> {

        const encodedToken = this.encodeString(token);

        const calendar = await this.calendarDB.findCalendarByPublicToken(encodedToken);
        
        if (!calendar) throw new Error('Lien de calendrier invalide ou révoqué');

        return this.exportICSCalendar(calendar.id!);
    }

    async updateExternalCalendars(): Promise<void> {
        const candidates = await this.calendarDB.findCalendarsToUpdate();
        
        for (let calendar of candidates) {
            calendar = this.mapToDecodedCalendar(calendar);

            console.log(`Vérification de la mise à jour pour le calendrier externe '${calendar.name}'`);
            try {
                if (this.shouldUpdateCalendar(calendar)) {
                    await this.processCalendarUpdate(calendar);
                }
            } catch (error) {
                console.error(`Erreur lors de la mise à jour du calendrier ${calendar.id}:`, error);
            }
        }
    }

    private shouldUpdateCalendar(calendar: Calendar): boolean {
        if (!calendar.url || !calendar.updateRule) return false;
        
        const lastUpdate = calendar.updatedAt 
            ? new Date(calendar.updatedAt) 
            : new Date(calendar.createdAt);
        
        const now = new Date();
        const diffInMs = now.getTime() - lastUpdate.getTime();

        const ONE_HOUR = 60 * 60 * 1000;

        switch (calendar.updateRule) {
            case 1: return diffInMs >= ONE_HOUR;
            case 2: return diffInMs >= (24 * ONE_HOUR);
            case 3: return diffInMs >= (7 * 24 * ONE_HOUR);
            case 4: return diffInMs >= (30 * 24 * ONE_HOUR);
            default: return false;
        }
    }

    private async processCalendarUpdate(calendar: Calendar): Promise<void> {
        const response = await fetch(calendar.url!);
        if (!response.ok) throw new Error("Impossible de télécharger le fichier ICS");
        const icsContent = await response.text();

        const { appointments } = ICSHandler.parse(icsContent);
        console.log(`Mise à jour du calendrier ${calendar.id} avec ${appointments.length} rendez-vous extraits.`);
        
        await this.calendarDB.deleteAllAppointmentsByCalendarId(calendar.id!);
        const appointmentService = ServiceFactory.getAppointmentService();
        
        for (const appt of appointments) {
            try {
                const baseData = {
                    calendarId: calendar.id!,
                    ownerId: calendar.ownerId,
                    title: appt.title || 'Sans titre',
                    description: appt.description || '',
                    startDate: appt.startDate,
                    endDate: appt.endDate,
                    tags: appt.tags || []
                };

                if (appt.recursionRule) {
                    await appointmentService.createRecurrentAppointment(
                        baseData.ownerId,
                        baseData.calendarId,
                        baseData.title,
                        baseData.description,
                        baseData.startDate,
                        baseData.endDate,
                        appt.recursionRule,
                        appt.recursionEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        baseData.tags
                    );
                } else {
                    await appointmentService.createAppointment(
                        baseData.ownerId,
                        baseData.calendarId,
                        baseData.title,
                        baseData.description,
                        baseData.startDate,
                        baseData.endDate,
                        baseData.tags
                    );
                }
            } catch (e) {
                console.warn(`Erreur insertion RDV mis à jour : ${e}`);
            }
        }
        await this.calendarDB.updateCalendar(calendar.id!, {
            updatedAt: new Date()
        });
    }
}