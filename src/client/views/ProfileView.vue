<template>
  <div class="min-h-screen bg-stone-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex-between h-16">
          <h1 class="text-2xl font-bold text-indigo-600">Mon Profil</h1>
          <button
              @click="goToHome"
              class="flex-gap px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Accueil
          </button>
        </div>
      </div>
    </div>

    <!-- Contenu Principal -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Section Profil -->
      <div class="card-section mb-6">
        <div class="flex-gap gap-6">
          <!-- Icône Utilisateur -->
          <div class="flex-shrink-0">
            <div class="w-20 h-20 rounded-full bg-indigo-100 flex-center">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4F46E5"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mx-auto mb-3"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>

          <!-- Informations Utilisateur -->
          <div class="flex-1">
            <h2 class="page-title mb-2">{{ userName }}</h2>
            <div class="space-y-1 text-sm text-gray-600">
              <p>
                <span class="font-medium">Membre depuis :</span>
                {{ formatDate(userCreatedAt) }}
              </p>
              <p>
                <span class="font-medium">Dernière activité :</span>
                {{ formatDate(lastActivity) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Nombre de Calendriers -->
        <div class="card-section">
          <div class="flex-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Calendriers</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 class="text-indigo-600">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ stats.calendarsCount }}</p>
        </div>

        <!-- Nombre de Rendez-vous -->
        <div class="card-section">
          <div class="flex-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Rendez-vous</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 class="text-green-600">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ stats.appointmentsCount }}</p>
        </div>

        <!-- Nombre de Rendez-vous Récurrents -->
        <div class="card-section">
          <div class="flex-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">RDV Récurrents</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 class="text-purple-600">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ stats.recurrentAppointmentsCount }}</p>
        </div>
      </div>

      <!-- Prochains Rendez-vous -->
      <div class="card-section">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Prochains Rendez-vous</h3>

        <div v-if="loading" class="loading-text">
          Chargement...
        </div>

        <div v-else-if="upcomingAppointments.length === 0" class="loading-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
               class="mx-auto mb-3 text-gray-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p class="text-sm">Aucun rendez-vous à venir</p>
        </div>

        <div v-else class="space-y-3">
          <div
              v-for="appointment in upcomingAppointments"
              :key="appointment.id"
              class="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
          >
            <div class="flex-between mb-2">
              <h4 class="font-medium text-gray-900">{{ appointment.title }}</h4>
              <span class="text-sm font-semibold text-indigo-600">{{ appointment.hour }}</span>
            </div>
            <p v-if="appointment.description" class="text-sm text-gray-600 mb-2">
              {{ appointment.description }}
            </p>
            <div class="flex-gap gap-2 text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{{ appointment.dateLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import {useRouter} from 'vue-router';
import axios from 'axios';
import {calendarService} from '../assets/calendar.js';

const router = useRouter();

const userName = ref('');
const userCreatedAt = ref(new Date());
const lastActivity = ref(new Date());
const loading = ref(false);
const calendars = ref([]);
const appointments = ref([]);

const stats = computed(() => ({
  calendarsCount: calendars.value.length,
  appointmentsCount: appointments.value.filter(a => !a.recursionRule).length,
  recurrentAppointmentsCount: appointments.value.filter(a => a.recursionRule !== undefined && a.recursionRule !== null).length
}));

const upcomingAppointments = computed(() => {
  const now = new Date();
  return appointments.value
      .filter(a => new Date(a.startDate) > now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5)
      .map(appt => ({
        ...appt,
        dateLabel: new Date(appt.startDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        hour: new Date(appt.startDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
      }));
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const goToHome = () => {
  router.push('/');
};

const loadUserData = async () => {
  loading.value = true;
  try {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      userName.value = storedUserName;
    }

    // Charger les calendriers
    calendars.value = await calendarService.getCalendarsByOwnerId();

    // Charger tous les rendez-vous
    appointments.value = [];
    for (const calendar of calendars.value) {
      const calendarAppointments = await calendarService.fetchAppointments(calendar);
      appointments.value.push(...calendarAppointments);
    }

    // Récupérer les infos utilisateur (date de création, etc.)
    // Note: Tu devras adapter selon ton API
    try {
      const response = await axios.get('/api/user/info');
      if (response.data) {
        userCreatedAt.value = response.data.createdAt || new Date();
        lastActivity.value = response.data.updatedAt || new Date();
      }
    } catch (error) {
      console.log('Infos utilisateur non disponibles');
    }

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  await loadUserData();
});
</script>