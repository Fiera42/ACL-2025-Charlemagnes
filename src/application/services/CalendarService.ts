import { Calendar } from "../../domain/entities/Calendar";
import { ServiceResponse } from "../../domain/entities/ServiceResponse.ts";
import { ICalendarDB } from "../../domain/interfaces/ICalendarDB";
import { ICalendarService } from "../../domain/interfaces/ICalendarService";
import { Sanitizer } from "./utils/Sanitizer";
import { decode, encode } from "html-entities";
import { IAuthDB } from "../../domain/interfaces/IAuthDB";
import { Appointment } from "../../domain/entities/Appointment";
import { ICSHandler } from "./utils/ICSHandler.ts";
import { ServiceFactory } from "../../adapters/factories/ServiceFactory.ts";
import { v4 as uuidv4 } from 'uuid';

export class CalendarService implements ICalendarService {
    private calendarDB: ICalendarDB;
    private authDB: IAuthDB;

    constructor(calendarDB: ICalendarDB, authDB: IAuthDB) {
        this.calendarDB = calendarDB;
        this.authDB = authDB;
    }

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

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                reject(new Error(`User of id (${ownerId}) does not exist`));
                return;
            }

            name = encode(name, { mode: 'extensive' });
            description = encode(description, { mode: 'extensive' });
            color = encode(color, { mode: 'extensive' });
            url = url ? encode(url, { mode: 'extensive' }) : null;
            updateRule = updateRule !== null ? updateRule : null;

            const calendar = Calendar.create(name, description, color, ownerId, url, updateRule);

            this.calendarDB.createCalendar(calendar)
                .then((calendar: Calendar) => {
                    calendar.name = decode(calendar.name);
                    calendar.description = decode(calendar.description);
                    calendar.color = decode(calendar.color);
                    calendar.url = calendar.url ? decode(calendar.url) : null;
                    calendar.updateRule = calendar.updateRule !== null ? calendar.updateRule : null;
                    resolve(calendar);
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

            if (calendar === undefined) return; // We already rejected in the catch
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
            if (deleteResult === undefined) return; // We already rejected in the catch

            if (deleteResult) {
                resolve(ServiceResponse.SUCCESS)
            } else {
                resolve(ServiceResponse.FAILED)
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
                reject(new Error(`AppointmentId (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return; // We already rejected in the catch
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

            const cleanedCalendar: Partial<Appointment> = {
                ...(partialCalendar.name && { name: encode(partialCalendar.name, { mode: 'extensive' }) }),
                ...(partialCalendar.description && { description: encode(partialCalendar.description, { mode: 'extensive' }) }),
                ...(partialCalendar.color && { color: encode(partialCalendar.color, { mode: 'extensive' }) }),
                ...(partialCalendar.url && { url: encode(partialCalendar.url, { mode: 'extensive' }) }),
                ...(partialCalendar.updateRule !== undefined && { updateRule: partialCalendar.updateRule }),
            };

            const updateResult = await this.calendarDB.updateCalendar(calendarId, cleanedCalendar)
                .catch((reason) => {
                    reject(reason);
                });
            if (updateResult === undefined) return; // We already rejected in the catch

            if (updateResult) {
                resolve(ServiceResponse.SUCCESS)
            } else {
                resolve(ServiceResponse.FAILED)
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

            if (calendar === undefined) return; // We already rejected in the catch
            if (calendar === null) {
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            calendar.name = decode(calendar.name);
            calendar.description = decode(calendar.description);
            calendar.color = decode(calendar.color);

            resolve(calendar);
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

            if (calendars === undefined) return; // We already rejected in the catch

            // We sanitized at creation, so we have to sanitize when getting it back
            calendars.forEach((calendar) => {
                // We sanitized at creation, so we have to sanitize when getting it back
                calendar.name = decode(calendar.name);
                calendar.description = decode(calendar.description);
                calendar.color = decode(calendar.color);
                calendar.url = calendar.url ? decode(calendar.url) : null;
                calendar.updateRule = calendar.updateRule !== null ? calendar.updateRule : null;
            })

            resolve(calendars);
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

        // Création du calendrier
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

        // Récupère les RDV normaux
        const appointmentsData = await appointmentService.getAppointmentsByCalendarId(calendarId);
        // Récupère les RDV récurrents
        const recurrentData = await appointmentService.getRecurrentAppointmentByCalendarId(calendarId);

        // Combine tout
        const allAppointments = [...appointmentsData, ...recurrentData];

        return ICSHandler.generate(calendar, allAppointments);
    }

    async getPublicLink(userId: string, calendarId: string): Promise<string> {
        const calendar = await this.getCalendarById(calendarId);
        
        if (!calendar) throw new Error("Calendrier introuvable");
        if (calendar.ownerId !== userId) throw new Error("Non autorisé");

        let token = calendar.publicToken;
        
        // Si le calendrier n'a pas encore de token public, on en génère un
        if (!token) {
            token = uuidv4();
            await this.calendarDB.updatePublicToken(calendarId, token);
        }

        // On retourne l'URI relative pour la route publique
        return `/api/public/calendar/${token}.ics`;
    }

    async exportPublicICSCalendar(token: string): Promise<string> {
        const calendar = await this.calendarDB.findCalendarByPublicToken(token);
        if (!calendar) throw new Error('Lien de calendrier invalide ou révoqué');

        return this.exportICSCalendar(calendar.id!);
    }

    async updateExternalCalendars(): Promise<void> {
        const candidates = await this.calendarDB.findCalendarsToUpdate();
        for (const calendar of candidates) {
            try {
                if (this.shouldUpdateCalendar(calendar)) {
                    await this.processCalendarUpdate(calendar);
                }
            } catch (error) {
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
            }
        }
        await this.calendarDB.updateCalendar(calendar.id!, {
            updatedAt: new Date()
        });
    }
}

