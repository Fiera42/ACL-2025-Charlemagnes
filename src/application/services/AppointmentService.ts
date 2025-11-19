import {Appointment} from "../../domain/entities/Appointment";
import {ServiceResponse} from "../../domain/entities/ServiceResponse.ts";
import {RecurrentAppointment} from "../../domain/entities/ReccurentAppointment";
import {RecursionRule} from "../../domain/entities/RecursionRule";
import {IAppointmentService} from "../../domain/interfaces/IAppointmentService";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {ITagDB} from "../../domain/interfaces/ITagDB";
import {Sanitizer} from "./utils/Sanitizer";
import {decode, encode} from "html-entities";

export class AppointmentService implements IAppointmentService {
    constructor(
        private calendarDB: ICalendarDB,
        private tagDB: ITagDB
    ) {}

    createAppointment(
        ownerId: string,
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date,
        tags: string[] = []
    ): Promise<Appointment> {
        return new Promise<Appointment>(async (resolve, reject) => {
            if (Object.prototype.toString.call(startDate) !== '[object Date]' || isNaN(startDate.getTime())) {
                reject(new Error(`StartDate (${startDate}) is not valid`));
                return;
            }
            if (Object.prototype.toString.call(endDate) !== '[object Date]' || isNaN(endDate.getTime())) {
                reject(new Error(`EndDate (${endDate}) is not valid`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
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
                reject(new Error(`CalendarId (${calendarId}) does not exist`));
                return;
            }
            if (ownerId !== calendar.ownerId) {
                reject(new Error(`User of id (${ownerId}) does not own calendar of id (${calendarId})`));
                return;
            }

            title = encode(title, {mode: 'extensive'});
            description = encode(description, {mode: 'extensive'});

            if (endDate < startDate) {
                let temp = endDate;
                endDate = startDate;
                startDate = temp;
            }

            const appointment = Appointment.create(calendarId, title, description, startDate, endDate, ownerId);

            this.calendarDB.createAppointment(appointment)
                .then(async (appointment: Appointment) => {
                    appointment.title = decode(appointment.title);
                    appointment.description = decode(appointment.description);
                    if (appointment.id) {
                        appointment.tags = await this.syncTagsForAppointment(appointment.id, tags);
                    }
                    resolve(appointment);
                })
                .catch((reason: any) => {
                    reject(reason);
                })
        });
    }

    createRecurrentAppointment(
        ownerId: string,
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date,
        recursionRule: RecursionRule,
        tags: string[] = []
    ): Promise<RecurrentAppointment> {
        return new Promise<RecurrentAppointment>(async (resolve, reject) => {

            if (Object.prototype.toString.call(startDate) !== '[object Date]' || isNaN(startDate.getTime())) {
                reject(new Error(`StartDate (${startDate}) is not valid`));
                return;
            }
            if (Object.prototype.toString.call(endDate) !== '[object Date]' || isNaN(endDate.getTime())) {
                reject(new Error(`EndDate (${endDate}) is not valid`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }
            if (!Object.values(RecursionRule).includes(recursionRule)) {
                reject(new Error(`RecursionRule (${recursionRule}) is invalid`));
                return;
            }
            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });
            if (calendar === undefined) return; // We already rejected in the catch
            if (calendar === null) {
                reject(new Error(`CalendarId (${calendarId}) does not exist`));
                return;
            }
            if (ownerId !== calendar.ownerId) {
                reject(new Error(`User of id (${ownerId}) does not own calendar of id (${calendarId})`));
                return;
            }
            title = encode(title, {mode: 'extensive'});
            description = encode(description, {mode: 'extensive'});
            if (endDate < startDate) {
                let temp = endDate;
                endDate = startDate;
                startDate = temp;
            }
            
            const recurrentAppointment = RecurrentAppointment.createRecurrent(
                calendarId,
                title,
                description,
                startDate,
                endDate,
                ownerId,
                [],
                recursionRule
            );
            
            this.calendarDB.createRecurrentAppointment(recurrentAppointment)
                .then(async (recurrentAppointment: RecurrentAppointment) => {
                    recurrentAppointment.title = decode(recurrentAppointment.title);
                    recurrentAppointment.description = decode(recurrentAppointment.description);
                    if (recurrentAppointment.id) {
                        recurrentAppointment.tags = await this.syncTagsForRecurrentAppointment(recurrentAppointment.id, tags);
                    }
                    resolve(recurrentAppointment);
                })
                .catch((reason: any) => {
                    reject(reason);
                })
        });
    }

    deleteAppointment(
        ownerId: string,
        appointmentId: string
    ): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }

            const appointment = await this.calendarDB.findAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return; // We already rejected in the catch
            if (appointment === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== appointment.ownerId) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            await this.syncTagsForAppointment(appointmentId, []);
            const deleteResult = await this.calendarDB.deleteAppointment(appointmentId)
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

    deleteRecurrentAppointment(
        ownerId: string,
        appointmentId: string
    ): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }

            const appointment = await this.calendarDB.findRecurrentAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return; // We already rejected in the catch
            if (appointment === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== appointment.ownerId) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            await this.syncTagsForRecurrentAppointment(appointmentId, []);
            const deleteResult = await this.calendarDB.deleteRecurrentAppointment(appointmentId)
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

    updateAppointment(
        ownerId: string,
        appointmentId: string,
        partialAppointment: Partial<Appointment>
    ): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }
            if (partialAppointment.calendarId && Sanitizer.doesStringContainSpecialChar(partialAppointment.calendarId)) {
                reject(new Error(`The new calendarId (${partialAppointment.calendarId}) contains special char`));
                return;
            }
            if ((partialAppointment.startDate || partialAppointment.startDate === null) && (Object.prototype.toString.call(partialAppointment.startDate) !== '[object Date]' || isNaN(partialAppointment.startDate.getTime()))) {
                reject(new Error(`The new StartDate (${partialAppointment.startDate}) is not valid`));
                return;
            }
            if ((partialAppointment.endDate || partialAppointment.endDate === null) && (Object.prototype.toString.call(partialAppointment.endDate) !== '[object Date]' || isNaN(partialAppointment.endDate.getTime()))) {
                reject(new Error(`The new EndDate (${partialAppointment.endDate}) is not valid`));
                return;
            }

            const appointment = await this.calendarDB.findAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return; // We already rejected in the catch
            if (appointment === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== appointment.ownerId
                || (partialAppointment.ownerId && partialAppointment.ownerId !== appointment.ownerId)
                || (partialAppointment.id && partialAppointment.id !== appointment.id)
            ) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            if(partialAppointment.calendarId) {
                const calendar = await this.calendarDB.findCalendarById(partialAppointment.calendarId)
                    .catch((reason) => {
                        reject(reason);
                    });

                if (calendar === undefined) return; // We already rejected in the catch
                if (calendar === null) {
                    resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                    return;
                }
            }

            if (partialAppointment.tags !== undefined) {
                await this.syncTagsForAppointment(appointmentId, partialAppointment.tags);
            }

            const cleanedAppointment: Partial<Appointment> = {
                ...(partialAppointment.title && {title: encode(partialAppointment.title, {mode: 'extensive'})}),
                ...(partialAppointment.description && {description: encode(partialAppointment.description, {mode: 'extensive'})}),
                ...(partialAppointment.calendarId && {calendarId: partialAppointment.calendarId}),
                ...(partialAppointment.startDate && {startDate: partialAppointment.startDate}),
                ...(partialAppointment.endDate && {endDate: partialAppointment.endDate}),
            };

            if ((cleanedAppointment.endDate as Date) < (cleanedAppointment.startDate as Date)) {
                let temp = cleanedAppointment.endDate;
                cleanedAppointment.endDate = cleanedAppointment.startDate;
                cleanedAppointment.startDate = temp;
            }

            const updateResult = await this.calendarDB.updateAppointment(appointmentId, cleanedAppointment)
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

    updateRecurrentAppointment(
        ownerId: string,
        appointmentId: string,
        partial: Partial<RecurrentAppointment>
    ): Promise<ServiceResponse> {
        return new Promise(async (resolve, reject) => {
            const appt = await this.calendarDB.findRecurrentAppointmentById(appointmentId)
                .catch(reason => reject(reason));
            if (!appt) return resolve(ServiceResponse.RESOURCE_NOT_EXIST);

            if (appt.ownerId !== ownerId)
                return resolve(ServiceResponse.FORBIDDEN);

            if (partial.recursionRule && 
                !Object.values(RecursionRule).includes(partial.recursionRule)) {
                return reject(new Error(`Invalid recursionRule`));
            }

            if (partial.tags !== undefined) {
                await this.syncTagsForRecurrentAppointment(appointmentId, partial.tags);
            }

            const updateResult = await this.calendarDB.updateRecurrentAppointment(appointmentId, partial)
                .catch(reason => reject(reason));

            if (updateResult)
                resolve(ServiceResponse.SUCCESS);
            else
                resolve(ServiceResponse.FAILED);
        });
    }


    shareAppointment(
        ownerId: string,
        appointmentId: string,
        sharedToId: string
    ): Promise<ServiceResponse> {
        throw new Error("Method not implemented.");
    }

    unShareAppointment(
        ownerId: string,
        appointmentId: string,
        sharedToId: string
    ): Promise<ServiceResponse> {
        throw new Error("Method not implemented.");
    }

    getAppointmentById(appointmentId: string): Promise<Appointment | null> {
        return new Promise<Appointment | null>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }

            const appointment = await this.calendarDB.findAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return; // We already rejected in the catch
            if (appointment === null) {
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            appointment.title = decode(appointment.title);
            appointment.description = decode(appointment.description);
            if (appointment.id) {
                await this.attachTagsToAppointment(appointment);
            }

            resolve(appointment);
        });
    }

    getAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
        return new Promise<Appointment[]>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }

            const appointments = await this.calendarDB.findAppointmentsByCalendarId(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointments === undefined) return; // We already rejected in the catch

            // We sanitized at creation, so we have to sanitize when getting it back
            appointments.forEach((appointment) => {
                appointment.title = decode(appointment.title);
                appointment.description = decode(appointment.description);
            })
            await this.attachTagsToAppointments(appointments);

            resolve(appointments);
        });
    }

    getRecurrentAppointmentByCalendarId(calendarId: string): Promise<RecurrentAppointment[]> {
        return new Promise<RecurrentAppointment[]>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }

            const appointments = await this.calendarDB.findRecurrentAppointmentsByCalendarId(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointments === undefined) return; // We already rejected in the catch

            // We sanitized at creation, so we have to sanitize when getting it back
            appointments.forEach((appointment) => {
                appointment.title = decode(appointment.title);
                appointment.description = decode(appointment.description);
            })
            await this.attachTagsToRecurrentAppointments(appointments);

            resolve(appointments);
        });
    }
    
    async getAllAppointmentsByCalendarId(calendarId: string): Promise<{appointments: Appointment[], recurrentAppointments: RecurrentAppointment[]}> {
        const appointments = await this.getAppointmentsByCalendarId(calendarId);
        const recurrentAppointments = await this.getRecurrentAppointmentByCalendarId(calendarId);
        return { appointments, recurrentAppointments };
    }

    getConflictsOfUser(
        ownerId: string
    ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]> {
        throw new Error("Method not implemented.");
    }

    getConflictsOfCalendar(
        calendarId: string
    ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]> {
        throw new Error("Method not implemented.");
    }

    private normalizeTagIds(tagIds?: string[]): string[] {
        const list = Array.isArray(tagIds) ? tagIds : [];
        const filtered = list.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
        return Array.from(new Set(filtered));
    }

    private async syncTagsForAppointment(appointmentId: string, tagIds?: string[]): Promise<string[]> {
        const normalized = this.normalizeTagIds(tagIds);
        const current = await this.tagDB.findTagsByAppointment(appointmentId);
        const currentIds = current.map(tag => tag.id as string);

        const toAdd = normalized.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !normalized.includes(id));

        await Promise.all(toAdd.map(id => this.tagDB.addTagToAppointment(appointmentId, id)));
        await Promise.all(toRemove.map(id => this.tagDB.removeTagFromAppointment(appointmentId, id)));

        return normalized;
    }

    private async syncTagsForRecurrentAppointment(appointmentId: string, tagIds?: string[]): Promise<string[]> {
        const normalized = this.normalizeTagIds(tagIds);
        const current = await this.tagDB.findTagsByRecurrentAppointment(appointmentId);
        const currentIds = current.map(tag => tag.id as string);

        const toAdd = normalized.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !normalized.includes(id));

        await Promise.all(toAdd.map(id => this.tagDB.addTagToRecurrentAppointment(appointmentId, id)));
        await Promise.all(toRemove.map(id => this.tagDB.removeTagFromRecurrentAppointment(appointmentId, id)));

        return normalized;
    }

    private async attachTagsToAppointment(appointment: Appointment): Promise<void> {
        if (!appointment.id) return;
        const tags = await this.tagDB.findTagsByAppointment(appointment.id);
        appointment.tags = tags.map(tag => tag.id as string);
    }

    private async attachTagsToAppointments(appointments: Appointment[]): Promise<void> {
        await Promise.all(appointments.map(appt => this.attachTagsToAppointment(appt)));
    }

    private async attachTagsToRecurrentAppointment(appointment: RecurrentAppointment): Promise<void> {
        if (!appointment.id) return;
        const tags = await this.tagDB.findTagsByRecurrentAppointment(appointment.id);
        appointment.tags = tags.map(tag => tag.id as string);
    }

    private async attachTagsToRecurrentAppointments(appointments: RecurrentAppointment[]): Promise<void> {
        await Promise.all(appointments.map(appt => this.attachTagsToRecurrentAppointment(appt)));
    }
}
