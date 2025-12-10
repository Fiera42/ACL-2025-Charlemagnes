import { Calendar } from '../../../domain/entities/Calendar';
import { UpdateRule } from '../../../domain/entities/UpdateRule'; // Assure-toi que cet import est correct

export class ICSHandler {
    // Regex pour extraire Clé:Valeur
    private static icsKeyRegex = /^([\w\s]+):(.*)$/m;

    /**
     * Parse un contenu ICS (string) en objets partiels Calendar et Appointments
     */
    static parse(icsContent: string): { calendar: Partial<Calendar>, appointments: any[] } {
        const calendar: any = {};
        const appointments: any[] = [];
        
        // Normalisation des sauts de ligne pour éviter les soucis entre Windows/Linux
        const lines = icsContent.split(/\r\n|\n|\r/);
        
        let currentComponent: string | null = null;
        let currentAppointment: any = null;

        for (const line of lines) {
            // Ignorer les lignes vides ou malformées
            const match = this.icsKeyRegex.exec(line);
            if (!match) continue;

            let [, key, value] = match;
            key = key.trim().toUpperCase();
            value = value.trim();

            if (key === 'BEGIN') {
                currentComponent = value;
                if (value === 'VEVENT') {
                    // Initialisation d'un nouveau rendez-vous
                    currentAppointment = { tags: [] };
                }
            } else if (key === 'END') {
                if (value === 'VEVENT' && currentAppointment) {
                    // Fin du rendez-vous, on l'ajoute à la liste
                    appointments.push(currentAppointment);
                    currentAppointment = null;
                }
                currentComponent = null;
            } 
            
            // --- PARSING CALENDRIER ---
            else if (currentComponent === 'VCALENDAR') {
                switch (key) {
                    case 'X-WR-CALNAME': 
                        calendar.name = value; 
                        break;
                    case 'X-WR-CALDESC': 
                        calendar.description = value; 
                        break;
                    // On peut ajouter la couleur si le format ICS le supporte (souvent non standard)
                    case 'X-WR-CALCOLOR':
                        calendar.color = value;
                        break;
                }
            } 
            
            // --- PARSING RENDEZ-VOUS ---
            else if (currentComponent === 'VEVENT' && currentAppointment) {
                // Gestion des paramètres (ex: DTSTART;VALUE=DATE:...)
                const cleanKey = key.split(';')[0]; 

                switch (cleanKey) {
                    case 'SUMMARY': 
                        currentAppointment.title = value; 
                        break;
                    case 'DESCRIPTION': 
                        currentAppointment.description = value; 
                        break;
                    case 'DTSTART': 
                        currentAppointment.startDate = this.parseDate(value); 
                        break;
                    case 'DTEND': 
                        currentAppointment.endDate = this.parseDate(value); 
                        break;
                    case 'RRULE': 
                        const rruleData = this.parseRRule(value);
                        if (rruleData) {
                            currentAppointment.recursionRule = rruleData.rule;
                            currentAppointment.recursionEndDate = rruleData.until;
                        }
                        break;
                    case 'CATEGORIES': 
                        // Sépare les tags par virgule
                        currentAppointment.tags = value.split(',').map(t => t.trim()); 
                        break;
                    case 'LOCATION':
                        // Optionnel si tu gères la localisation
                        currentAppointment.location = value;
                        break;
                }
            }
        }

        return { calendar, appointments };
    }

    /**
     * Génère une chaîne ICS à partir d'un calendrier et de ses rendez-vous
     */
    static generate(calendar: Calendar, appointments: any[]): string {
        const lines: string[] = [];

        // Header
        lines.push('BEGIN:VCALENDAR');
        lines.push('VERSION:2.0');
        lines.push('PRODID:-//ACL 2025 CHARLEMAGNES//NONSGML Calendar//FR');
        
        if (calendar.name) lines.push(`X-WR-CALNAME:${calendar.name}`);
        if (calendar.description) lines.push(`X-WR-CALDESC:${calendar.description}`);
        // Standard non-officiel pour la couleur (Apple/Google)
        if (calendar.color) lines.push(`X-APPLE-CALENDAR-COLOR:${calendar.color}`);

        for (const appt of appointments) {
            lines.push('BEGIN:VEVENT');
            lines.push(`UID:${appt.id || this.generateUid()}`); // UID est important pour l'export
            lines.push(`DTSTAMP:${this.formatDate(new Date())}`); // Date de génération
            
            if (appt.title) lines.push(`SUMMARY:${appt.title}`);
            if (appt.description) lines.push(`DESCRIPTION:${appt.description}`);
            
            if (appt.startDate) lines.push(`DTSTART:${this.formatDate(new Date(appt.startDate))}`);
            if (appt.endDate) lines.push(`DTEND:${this.formatDate(new Date(appt.endDate))}`);
            
            // Gestion de la récurrence
            if (appt.recursionRule !== undefined && appt.recursionRule !== null) {
                const freq = this.getFreqString(appt.recursionRule);
                let rrule = `FREQ=${freq}`;
                if (appt.recursionEndDate) {
                    rrule += `;UNTIL=${this.formatDate(new Date(appt.recursionEndDate))}`;
                }
                lines.push(`RRULE:${rrule}`);
            }
            
            // Gestion des tags (Categories)
            if (appt.tags && appt.tags.length > 0) {
                // Si tes tags sont des objets {id, name}, utilise .map(t => t.name)
                // Si ce sont des strings, utilise tel quel.
                const tagNames = appt.tags.map((t: any) => (typeof t === 'string' ? t : t.name)).join(',');
                lines.push(`CATEGORIES:${tagNames}`);
            }

            lines.push('END:VEVENT');
        }

        lines.push('END:VCALENDAR');
        return lines.join('\r\n'); // Le standard ICS préfère \r\n
    }

    // --- HELPERS PRIVÉS ---

    /**
     * Parse une date ICS (YYYYMMDDTHHMMSSZ ou YYYYMMDD)
     */
    private static parseDate(value: string): Date {
        // Enlève le 'Z' ou les paramètres superflus
        const cleanValue = value.replace('Z', '').trim();
        
        if (cleanValue.length === 8) {
            // Format YYYYMMDD (Date seulement)
            const y = parseInt(cleanValue.substring(0, 4));
            const m = parseInt(cleanValue.substring(4, 6)) - 1;
            const d = parseInt(cleanValue.substring(6, 8));
            return new Date(y, m, d);
        } else if (cleanValue.length >= 15) {
            // Format YYYYMMDDTHHMMSS
            const y = parseInt(cleanValue.substring(0, 4));
            const m = parseInt(cleanValue.substring(4, 6)) - 1;
            const d = parseInt(cleanValue.substring(6, 8));
            const th = parseInt(cleanValue.substring(9, 11));
            const tm = parseInt(cleanValue.substring(11, 13));
            const ts = parseInt(cleanValue.substring(13, 15));
            // On traite comme UTC pour simplifier ou Local selon le besoin
            return new Date(Date.UTC(y, m, d, th, tm, ts));
        }
        
        return new Date(cleanValue); // Fallback
    }

    /**
     * Formate une date JS en string ICS (YYYYMMDDTHHMMSSZ)
     */
    private static formatDate(date: Date): string {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Parse la règle de récurrence (RRULE)
     */
    private static parseRRule(value: string): { rule: number, until?: Date } | null {
        const parts = value.split(';');
        let rule = UpdateRule.DAILY; // Valeur par défaut
        let until: Date | undefined;

        for (const part of parts) {
            const [k, v] = part.split('=');
            if (k === 'FREQ') {
                switch (v) {
                    case 'HOURLY': rule = UpdateRule.HOURLY; break;
                    case 'DAILY': rule = UpdateRule.DAILY; break;
                    case 'WEEKLY': rule = UpdateRule.WEEKLY; break;
                    case 'MONTHLY': rule = UpdateRule.MONTHLY; break;
                    case 'YEARLY': 
                        // Si YEARLY n'existe pas dans ton enum UpdateRule, on map sur MONTHLY ou on adapte l'enum
                        rule = UpdateRule.MONTHLY; 
                        break; 
                }
            } else if (k === 'UNTIL') {
                until = this.parseDate(v);
            }
        }
        return { rule, until };
    }

    /**
     * Convertit l'Enum UpdateRule en string ICS
     */
    private static getFreqString(rule: number): string {
        switch (rule) {
            case UpdateRule.HOURLY: return 'HOURLY';
            case UpdateRule.DAILY: return 'DAILY';
            case UpdateRule.WEEKLY: return 'WEEKLY';
            case UpdateRule.MONTHLY: return 'MONTHLY';
            // Ajoute YEARLY ici si tu l'as ajouté à ton Enum
            default: return 'DAILY';
        }
    }

    private static generateUid(): string {
        return Math.random().toString(36).substr(2, 9) + '@charlemagnes.com';
    }
}