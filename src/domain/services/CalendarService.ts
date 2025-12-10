import { CalendarRepository } from '../repositories/CalendarRepository';
import { Calendar } from '../entities/Calendar';
import { TagRepository } from '../repositories/TagRepository';
import { ICSHandler } from '../../adapters/utils/ICSHandler';
import { ServiceFactory } from '../../factories/ServiceFactory';

export class CalendarService {
    constructor(
        private calendarRepository: CalendarRepository,
        private tagRepository: TagRepository
    ) {}

    async createCalendar(ownerId: string, name: string, description: string, color: string, url: string | null = null, updateRule: number | null = null): Promise<Calendar> {
        const calendar = Calendar.create(name, description, color, ownerId, url, updateRule);
        return this.calendarRepository.save(calendar);
    }

    async getCalendarsByOwnerId(ownerId: string): Promise<Calendar[]> {
        return this.calendarRepository.findAllByOwnerId(ownerId);
    }

    async getCalendarById(id: string): Promise<Calendar | null> {
        return this.calendarRepository.findById(id);
    }

    async updateCalendar(userId: string, calendarId: string, data: Partial<Calendar>): Promise<Calendar> {
        const calendar = await this.calendarRepository.findById(calendarId);
        if (!calendar) throw new Error('Calendrier non trouvé');
        if (calendar.ownerId !== userId) throw new Error('Accès non autorisé');

        const updatedCalendar = new Calendar(
            calendar.id,
            data.name || calendar.name,
            data.description || calendar.description,
            data.color || calendar.color,
            calendar.ownerId,
            calendar.createdAt,
            new Date(),
            userId,
            data.url !== undefined ? data.url : calendar.url,
            data.updateRule !== undefined ? data.updateRule : calendar.updateRule
        );

        return this.calendarRepository.update(updatedCalendar);
    }

    async deleteCalendar(userId: string, calendarId: string): Promise<void> {
        const calendar = await this.calendarRepository.findById(calendarId);
        if (!calendar) throw new Error('Calendrier non trouvé');
        if (calendar.ownerId !== userId) throw new Error('Accès non autorisé');

        return this.calendarRepository.delete(calendarId);
    }

    async shareCalendar(ownerId: string, calendarId: string, sharedToId: string): Promise<void> {
        // Vérification des droits
        const calendar = await this.calendarRepository.findById(calendarId);
        if (!calendar || calendar.ownerId !== ownerId) {
            throw new Error('Calendrier non trouvé ou accès refusé');
        }
        return this.calendarRepository.share(calendarId, sharedToId);
    }

    async unShareCalendar(ownerId: string, calendarId: string, sharedToId: string): Promise<void> {
        const calendar = await this.calendarRepository.findById(calendarId);
        if (!calendar || calendar.ownerId !== ownerId) {
            throw new Error('Calendrier non trouvé ou accès refusé');
        }
        return this.calendarRepository.unshare(calendarId, sharedToId);
    }

    async getTags(): Promise<any[]> {
        return this.tagRepository.findAll();
    }

    async deleteTag(tagId: string): Promise<void> {
        return this.tagRepository.delete(tagId);
    }

    async importCalendarFromUrl(userId: string, url: string, autoUpdate: boolean, updateRule: number | null) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Impossible de récupérer le calendrier depuis l'URL: ${response.statusText}`);
            const icsContent = await response.text();
            
            return this.importCalendarFromICS(userId, icsContent, url, autoUpdate ? updateRule : null);
        } catch (error) {
            console.error("Erreur import URL:", error);
            throw error;
        }
    }

    async importCalendarFromContent(content: string, calendarName: string): Promise<void> {
        // TODO: Implémenter une méthode simplifiée si besoin, ou utiliser importCalendarFromICS
        // Pour l'instant on suppose que l'appelant gère l'ID utilisateur, ici on mock un appel interne
        // Cette méthode semble être appelée depuis le front sans userId explicite dans le service actuel
        // Il faudrait revoir la signature ou l'appel.
    }

    async importCalendarFromICS(userId: string, icsContent: string, url: string | null = null, updateRule: number | null = null) {
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
             } catch (e) {
                 console.warn(`Erreur lors de l'import d'un rendez-vous: ${e}`);
             }
        }
        return calendar;
    }

    async getCalendarICS(calendarId: string): Promise<string> {
        const calendar = await this.getCalendarById(calendarId);
        if (!calendar) throw new Error('Calendrier non trouvé');

        const appointmentService = ServiceFactory.getAppointmentService();
        const appointments = await appointmentService.getAllAppointmentsByCalendarId(calendarId);
        
        return ICSHandler.generate(calendar, appointments);
    }
    
    async exportICSCalendar(calendarId: string): Promise<string> {
        return this.getCalendarICS(calendarId);
    }

    async getPublicLink(userId: string, calendarId: string): Promise<string> {
        const calendar = await this.getCalendarById(calendarId);
        if (!calendar) throw new Error('Calendrier non trouvé');
        if (calendar.ownerId !== userId) throw new Error('Accès refusé');

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // TODO: Sauvegarder le token
        return `/api/calendar/public/${token}.ics`;
    }

    async exportPublicICSCalendar(token: string): Promise<string> {
        throw new Error("Export public non implémenté");
    }
}