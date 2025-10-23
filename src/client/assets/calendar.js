import axios from 'axios';

                // Configure axios pour inclure le token JWT si disponible
                axios.defaults.headers.common['Authorization'] = localStorage.getItem('token')
                  ? `Bearer ${localStorage.getItem('token')}`
                  : '';

                export const calendarService = {
                  // ID du calendrier par défaut (à adapter selon ton besoin)
                  currentCalendarId: '1',

                  // Récupérer tous les rendez-vous d'un calendrier
                  async fetchAppointments(calendarId = this.currentCalendarId) {
                    try {
                      const response = await axios.get(`/api/calendar/${calendarId}/appointments`);
                      console.log('Réponse API brute:', response.data);

                      const appointments = response.data.appointments || [];

                      return appointments.map(appt => ({
                        id: appt.id,
                        title: appt.title,
                        description: appt.description,
                        startDate: new Date(appt.startDate),
                        endDate: new Date(appt.endDate),
                        date: new Date(appt.startDate).toDateString(),
                        hour: new Date(appt.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        time: `${new Date(appt.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appt.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                        colorClass: 'border-blue-600 bg-blue-50',
                        textColor: 'text-blue-600',
                        calendarId: appt.calendarId
                      }));
                    } catch (error) {
                      console.error('Erreur détaillée:', {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status
                      });
                      throw error;
                    }
                  },

                  // Créer un rendez-vous
                  async createAppointment(appointment, calendarId = this.currentCalendarId) {
                    try {
                      await axios.post(`/api/calendar/${calendarId}/appointments`, {
                        title: appointment.title,
                        description: appointment.description,
                        startDate: appointment.startDate.toISOString(),
                        endDate: appointment.endDate.toISOString()
                      });
                    } catch (error) {
                      console.error('Erreur lors de la création:', error.response?.data || error);
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
                        endDate: appointment.endDate.toISOString()
                      });
                    } catch (error) {
                      console.error('Erreur lors de la modification:', error.response?.data || error);
                      throw error;
                    }
                  },

                  // Supprimer un rendez-vous
                  async deleteAppointment(appointmentId) {
                    try {
                      await axios.delete(`/api/calendar/appointments/${appointmentId}`);
                    } catch (error) {
                      console.error('Erreur lors de la suppression:', error.response?.data || error);
                      throw error;
                    }
                  }
                };