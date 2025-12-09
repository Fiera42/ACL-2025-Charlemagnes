import axios from 'axios';

// Configure axios pour inclure le token JWT si disponible
axios.defaults.headers.common['Authorization'] = localStorage.getItem('token')
    ? `Bearer ${localStorage.getItem('token')}`
    : '';

export const calendarService = {
    // ID du calendrier par défaut (à adapter selon ton besoin)
    visibleCalendars: new Set(),

    normalize(appt, calendar) {
        return {
            id: appt.id,
            title: appt.title,
            description: appt.description,
            startDate: new Date(appt.startDate),
            endDate: new Date(appt.endDate),
            date: new Date(appt.startDate).toDateString(),
            hour: new Date(appt.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            time: `${new Date(appt.startDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })} - ${new Date(appt.endDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })}`,
            color: calendar.color,
            calendarId: appt.calendarId,
            recursionRule: appt.recursionRule ?? null,
            recursionEndDate: appt.recursionEndDate ? new Date(appt.recursionEndDate) : null,
            tags: appt.tags || []
        };
    },

    // Récupérer tous les rendez-vous d'un calendrier
    async fetchAppointments(calendar) {
        if(!calendar.id) {
            throw new Error('No calendarId provided');
        }
        try {
            console.log('📡 Fetching appointments for calendar:', calendar.id);
            const response = await axios.get(`/api/calendar/${calendar.id}/appointments`);
            console.log('📦 Raw response from server:', response.data);

            const appointments = response.data.appointments || [];
            const recurrentAppointments = response.data.recurrentAppointments || [];

            console.log('📋 Appointments count:', appointments.length);
            console.log('🔁 Recurrent appointments count:', recurrentAppointments.length);

            if (appointments.length > 0) {
                console.log('🔍 First appointment raw:', appointments[0]);
                console.log('🏷️ First appointment tags:', appointments[0]?.tags);
            }

            if (recurrentAppointments.length > 0) {
                console.log('🔍 First recurrent appointment raw:', recurrentAppointments[0]);
                console.log('🏷️ First recurrent appointment tags:', recurrentAppointments[0]?.tags);
            }

            const allEvents = [
                ...appointments.map((apt) => this.normalize(apt, calendar)),
                ...recurrentAppointments.map((apt) => this.normalize(apt, calendar))
            ];

            console.log('Total normalized events:', allEvents.length);
            if (allEvents.length > 0) {
                console.log('First normalized event tags:', allEvents[0].tags);
            }

            return allEvents;

        } catch (error) {
            console.error('Error fetching appointments:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    // Récupère tout les rendez-vous d'un calendrier puis filtre selon le mot recherché
    async searchAppointments(word, calendarId) {
        if(!calendarId) {
            throw new Error('No calendarId provided');
        }

        const allAppointments = await this.fetchAppointments(calendarId);
        if (!word) return allAppointments;

        const lowerCaseWord = word.toLowerCase();
        return allAppointments.filter(appt =>
            appt.title.toLowerCase().includes(lowerCaseWord) ||
            appt.description?.toLowerCase().includes(lowerCaseWord)
        );
    },

    // Créer un rendez-vous
    async createAppointment(appointment) {
        if(!appointment.calendarId) {
            throw new Error('No calendarId provided');
        }
        try {
            await axios.post(`/api/calendar/${appointment.calendarId}/appointments`, {
                title: appointment.title,
                description: appointment.description,
                startDate: appointment.startDate.toISOString(),
                endDate: appointment.endDate.toISOString(),
                tags: appointment.tags || []
            });
        } catch (error) {
            console.error('Erreur lors de la création:', error.response?.data || error);
            throw error;
        }
    },

    async createRecurrentAppointment(appointment) {
        if(!appointment.calendarId) {
            throw new Error('No calendarId provided');
        }
        try {
            await axios.post(`/api/calendar/${appointment.calendarId}/appointments`, {
                title: appointment.title,
                description: appointment.description,
                startDate: appointment.startDate.toISOString(),
                endDate: appointment.endDate.toISOString(),
                recursionRule: appointment.recursionRule,
                recursionEndDate: appointment.recursionEndDate.toISOString(),
                tags: appointment.tags || []
            });
        } catch (error) {
            console.error('Erreur lors de la création récurrente:', error.response?.data || error);
            throw error;
        }
    },

    // Modifier un rendez-vous
    async updateAppointment(appointment) {
        try {
            await axios.put(`/api/calendar/appointments/${appointment.id}`, {
                title: appointment.title,
                description: appointment.description,
                startDate: appointment.startDate.toISOString(),
                endDate: appointment.endDate.toISOString(),
                recursionRule: appointment.recursionRule ?? null,
                recursionEndDate: appointment.recursionEndDate ? appointment.recursionEndDate.toISOString() : null,
                tags: appointment.tags || []
            });
        } catch (error) {
            console.error('Erreur lors de la modification:', error.response?.data || error);
            throw error;
        }
    },

    // Supprimer un rendez-vous
    async deleteAppointment(appointmentId, recursionRule) {
        try {
            await axios.delete(`/api/calendar/appointments/${appointmentId}?recurring=${recursionRule !== undefined && recursionRule !== null}`);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error.response?.data || error);
            throw error;
        }
    },

    //récupérer tout les agendas de l'utilisateur connecté
    async getCalendarsByOwnerId() {
        try {
            const jsonCalendars = await axios.get('/api/calendar');
            return jsonCalendars.data.calendars;
        } catch (error) {
            console.error('Erreur lors de la recuperation des agendas 1 :', error.response.data || error);
            throw error;
        }
    },

    //creer un nouveau calendrier
    async createCalendar(calendar) {
        try {
            const jsonCalendar = await axios.post('/api/calendar', {
                name: calendar.name,
                description: calendar.description,
                color: calendar.color
            });
            return jsonCalendar.data;
        } catch (error) {
            console.error('Erreur lors de la creation de l agenda :', error.response.data || error);
            throw error;
        }
    },

    //supprimer un calendrier
    async deleteCalendar(calendarId) {
        try {
            await axios.delete(`/api/calendar/${calendarId}`, {id: calendarId});
        } catch (error) {
            console.error('Erreur lors de la deletion de l agenda:', error.response.data || error);
            throw error;
        }
    },

    //obtenir les rdv d'un calendrier
    async getAppointmentsByCalendarId(calendar) {
        try {
            const jsonCalendars = await axios.get(`/api/calendar/${calendar.id}/appointments`);
            jsonCalendars.data.appointments.push(...jsonCalendars.data.recurrentAppointments);
            return jsonCalendars.data.appointments.map((apt) => this.normalize(apt, calendar));
        } catch (error) {
            console.error('Erreur lors de la recuperation des rendez-vous d\'agenda :', error.response.data || error);
            throw error;
        }
    },

    //modifier les paramètres d'un seul calendrier
    async updateCalendar(calendar) {
        try {
            await axios.put(`/api/calendar/${calendar.id}`, {
                name: calendar.name,
                description: calendar.description,
                color: calendar.color
            });
        } catch (error) {
            console.error('Erreur lors de l update de l agenda 1 :', error.response.data || error);
            throw error;
        }
    },

    async getTags() {
        const { data } = await axios.get('/api/tag');
        return data.tags ?? [];
    },

    async createTag(tag) {
        const { data } = await axios.post('/api/tag', tag);
        return data;
    },

    async updateTag(tagId, tag) {
        const { data } = await axios.put(`/api/tag/${tagId}`, tag);
        return data;
    },

    async deleteTag(tagId) {
        await axios.delete(`/api/tag/${tagId}`);
    }
};