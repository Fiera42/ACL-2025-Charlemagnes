import { Appointment } from "../../domain/entities/Appointment";
import { ServiceResponse } from "../../domain/entities/ServiceResponse.ts";
import { RecurrentAppointment } from "../../domain/entities/ReccurentAppointment";
import { RecursionRule } from "../../domain/entities/RecursionRule";
import { IAppointmentService } from "../../domain/interfaces/IAppointmentService";
import { ICalendarDB } from "../../domain/interfaces/ICalendarDB";
import { ITagDB } from "../../domain/interfaces/ITagDB";
import { Sanitizer } from "./utils/Sanitizer";
import { decode, encode } from "html-entities";

export class AppointmentService implements IAppointmentService {
    constructor(
        private calendarDB: ICalendarDB,
        private tagDB: ITagDB
    ) {
    }

    createAppointment(
        ownerId: string,
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date,
        tags: string[]
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

            if (calendar === undefined) return;
            if (calendar === null) {
                reject(new Error(`CalendarId (${calendarId}) does not exist`));
                return;
            }
            if (ownerId !== calendar.ownerId) {
                reject(new Error(`User of id (${ownerId}) does not own calendar of id (${calendarId})`));
                return;
            }

            title = encode(title, { mode: 'extensive' });
            description = encode(description, { mode: 'extensive' });

            if (endDate < startDate) {
                let temp = endDate;
                endDate = startDate;
                startDate = temp;
            }

            const appointment = Appointment.create(calendarId, title, description, startDate, endDate, ownerId, tags);

            this.calendarDB.createAppointment(appointment)
                .then(async (createdAppointment: Appointment) => {
                    createdAppointment.title = decode(createdAppointment.title);
                    createdAppointment.description = decode(createdAppointment.description);
                    resolve(createdAppointment);
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
        recursionEndDate: Date,
        tags: string[]
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
            if (Object.prototype.toString.call(recursionEndDate) !== '[object Date]' || isNaN(recursionEndDate.getTime())) {
                reject(new Error(`RecursionEndDate (${recursionEndDate}) is not valid`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });
            if (calendar === undefined) return;
            if (calendar === null) {
                reject(new Error(`CalendarId (${calendarId}) does not exist`));
                return;
            }
            if (ownerId !== calendar.ownerId) {
                reject(new Error(`User of id (${ownerId}) does not own calendar of id (${calendarId})`));
                return;
            }

            title = encode(title, { mode: 'extensive' });
            description = encode(description, { mode: 'extensive' });

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
                tags,
                recursionRule,
                recursionEndDate
            );

            this.calendarDB.createRecurrentAppointment(recurrentAppointment)
                .then(async (createdAppointment: RecurrentAppointment) => {
                    createdAppointment.title = decode(createdAppointment.title);
                    createdAppointment.description = decode(createdAppointment.description);
                    resolve(createdAppointment);
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

            if (appointment === undefined) return;
            if (appointment === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== appointment.ownerId) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            const deleteResult = await this.calendarDB.deleteAppointment(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });
            if (deleteResult === undefined) return;

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

            if (appointment === undefined) return;
            if (appointment === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== appointment.ownerId) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            const deleteResult = await this.calendarDB.deleteRecurrentAppointment(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });
            if (deleteResult === undefined) return;

            if (deleteResult) {
                resolve(ServiceResponse.SUCCESS)
            } else {
                resolve(ServiceResponse.FAILED)
            }
        });
    }

    /**
     * Met à jour un rendez-vous en changeant son type (simple <-> récurrent) si nécessaire.
     * @param ownerId L'ID du propriétaire du rendez-vous.
     * @param appointmentId L'ID du rendez-vous à mettre à jour.
     * @param partial Les champs à mettre à jour. Si `recursionRule` est défini, le rendez-vous sera converti en récurrent.
     */
    async updateAppointmentType(
        ownerId: string,
        appointmentId: string,
        partial: Partial<Appointment & RecurrentAppointment>
    ): Promise<ServiceResponse> {

        // Récupérer l'événement actuel
        const apptSimple = await this.calendarDB.findAppointmentById(appointmentId);
        const apptRecurrent = await this.calendarDB.findRecurrentAppointmentById(appointmentId);

        if (!apptSimple && !apptRecurrent) return ServiceResponse.RESOURCE_NOT_EXIST;
        if ((apptSimple && apptSimple.ownerId !== ownerId) || (apptRecurrent && apptRecurrent.ownerId !== ownerId))
            return ServiceResponse.FORBIDDEN;

        // Cas 1 : Simple -> récurrent
        if (!apptRecurrent && partial.recursionRule !== undefined && partial.recursionRule !== null) {
            // Supprimer simple
            if (apptSimple) await this.calendarDB.deleteAppointment(appointmentId);

            // Créer récurrent
            const newRecurrent: RecurrentAppointment = {
                ...apptSimple!,
                ...partial,
                recursionRule: partial.recursionRule,
                recursionEndDate: partial.recursionEndDate || null,
            };
            await this.calendarDB.createRecurrentAppointment(newRecurrent);
            return ServiceResponse.SUCCESS;
        }

        // Cas 2 : Récurrent -> simple
        if (apptRecurrent && (partial.recursionRule === undefined || partial.recursionRule === null)) {
            // Supprimer récurrent
            await this.calendarDB.deleteRecurrentAppointment(appointmentId);

            // Créer simple
            const newSimple: Appointment = {
                ...apptRecurrent,
                ...partial,
                recursionRule: undefined,
                recursionEndDate: null,
            };
            await this.calendarDB.createAppointment(newSimple);
            return ServiceResponse.SUCCESS;
        }

        // Sinon, juste une mise à jour normale
        if (apptSimple) return this.updateAppointment(ownerId, appointmentId, partial);
        if (apptRecurrent) return this.updateRecurrentAppointment(ownerId, appointmentId, partial);

        return ServiceResponse.FAILED;
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

            if (appointment === undefined) return;
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

            if (partialAppointment.calendarId) {
                const calendar = await this.calendarDB.findCalendarById(partialAppointment.calendarId)
                    .catch((reason) => {
                        reject(reason);
                    });

                if (calendar === undefined) return;
                if (calendar === null) {
                    resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                    return;
                }
            }

            if (partialAppointment.tags !== undefined) {
                await this.syncTagsForAppointment(appointmentId, partialAppointment.tags);
            }

            const cleanedAppointment: Partial<Appointment> = {
                ...(partialAppointment.title && { title: encode(partialAppointment.title, { mode: 'extensive' }) }),
                ...(partialAppointment.description && { description: encode(partialAppointment.description, { mode: 'extensive' }) }),
                ...(partialAppointment.calendarId && { calendarId: partialAppointment.calendarId }),
                ...(partialAppointment.startDate && { startDate: partialAppointment.startDate }),
                ...(partialAppointment.endDate && { endDate: partialAppointment.endDate }),
                ...(partialAppointment.updatedBy && { updatedBy: partialAppointment.updatedBy }),
                ...(partialAppointment.ownerId && { ownerId: partialAppointment.ownerId }),
                ...(partialAppointment.tags && { tags: partialAppointment.tags }),
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
            if (updateResult === undefined) return;

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

            if (partial.recursionEndDate !== undefined) {
                if (partial.recursionEndDate !== null &&
                    (Object.prototype.toString.call(partial.recursionEndDate) !== '[object Date]' ||
                        isNaN(partial.recursionEndDate.getTime()))
                ) {
                    return reject(new Error(`The new recursionEndDate (${partial.recursionEndDate}) is not valid`));
                }
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

            if (appointment === undefined) return;
            if (appointment === null) {
                resolve(null);
                return;
            }

            appointment.title = decode(appointment.title);
            appointment.description = decode(appointment.description);

            resolve(appointment);
        });
    }

    getRecurrentAppointmentById(appointmentId: string): Promise<RecurrentAppointment | null> {
        return new Promise<RecurrentAppointment | null>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }

            const appointment = await this.calendarDB.findRecurrentAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return;
            if (appointment === null) {
                resolve(null);
                return;
            }

            appointment.title = decode(appointment.title);
            appointment.description = decode(appointment.description);

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

            if (appointments === undefined) return;

            appointments.forEach((appointment) => {
                appointment.title = decode(appointment.title);
                appointment.description = decode(appointment.description);
            });

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

            if (appointments === undefined) return;

            appointments.forEach((appointment) => {
                appointment.title = decode(appointment.title);
                appointment.description = decode(appointment.description);
            });

            resolve(appointments);
        });
    }

    async getAllAppointmentsByCalendarId(calendarId: string): Promise<{
        appointments: Appointment[],
        recurrentAppointments: RecurrentAppointment[]
    }> {
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
        const currentTagIds = await this.getAppointmentTagIds(appointmentId);

        await this.applyTagChanges(
            normalized,
            currentTagIds,
            (tags) => this.tagDB.addAllTagsToAppointment(appointmentId, tags),
            (tagId) => this.tagDB.removeTagFromAppointment(appointmentId, tagId)
        );

        return normalized;
    }

    private async syncTagsForRecurrentAppointment(appointmentId: string, tagIds?: string[]): Promise<string[]> {
        const normalized = this.normalizeTagIds(tagIds);
        const currentTagIds = await this.getRecurrentAppointmentTagIds(appointmentId);

        await this.applyTagChanges(
            normalized,
            currentTagIds,
            (tags) => this.tagDB.addAllTagsToRecurrentAppointment(appointmentId, tags),
            (tagId) => this.tagDB.removeTagFromRecurrentAppointment(appointmentId, tagId)
        );

        return normalized;
    }

    private async getAppointmentTagIds(appointmentId: string): Promise<string[]> {
        const tags = await this.tagDB.findTagsByAppointment(appointmentId);
        return tags.map(tag => tag.id as string);
    }

    private async getRecurrentAppointmentTagIds(appointmentId: string): Promise<string[]> {
        const tags = await this.tagDB.findTagsByRecurrentAppointment(appointmentId);
        return tags.map(tag => tag.id as string);
    }

    private async applyTagChanges(
        newTagIds: string[],
        currentTagIds: string[],
        addFn: (tags: string[]) => Promise<void>,
        removeFn: (tagId: string) => Promise<boolean>
    ): Promise<void> {
        const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
        const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));

        if (tagsToAdd.length > 0) {
            await addFn(tagsToAdd);
        }

        if (tagsToRemove.length > 0) {
            await Promise.all(tagsToRemove.map(removeFn));
        }
    }

}