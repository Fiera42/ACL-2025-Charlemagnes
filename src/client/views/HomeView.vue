<template>
  <div id="app" class="min-h-screen bg-stone-50 flex flex-col">
    <AppHeader :user-name="userName" :appointments="appointments" :reset-search-key="resetSearchKey"
      :reset-filters-key="resetFiltersKey" :tags="tags" @toggle-sidebar="toggleSidebar" @logout="handleLogout"
      @search="handleSearch" @selectAppointment="handleSelectAppointment" @filters-changed="handleFilters" />

    <div class="flex flex-1 relative">
      <AppSidebar :is-open="sidebarOpen" :appointments="appointments" :appointmentsdisplayed="appointmentsdisplayed"
        :loading="loading" :loadingCalendars="loadingCalendars" :calendars="calendars"
        :shared-calendars="sharedCalendars" :calendarsdisplayed="calendarsdisplayed" :tags="tags"
        @toggleappointmentsdisplay="viewAppointments" @togglecalendarsdisplay="viewCalendars" @close="closeSidebar"
        @select-appointment="handleSelectAppointment" @selectCalendar="handleSelectCalendar"
        @CalendarForm="openCalendarForm" @deleteCalendar="deleteCalendar" @editCalendar="openCalendarForm"
        @exportCalendar="exportCalendar" @import-calendar="importCalendar" @calendarToggled="calendarToggled"
        @editTag="openTagForm" @deleteTag="deleteTag" @removeSharedCalendar="handleRemoveSharedCalendar" />

      <main :class="[
        'flex-1 transition-all duration-300',
        sidebarOpen ? 'ml-80' : 'ml-0'
      ]">
        <div class="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <CalendarView ref="calendarViewRef" :appointments="filteredAppointments" :calendars="calendars"
            :shared-calendars="sharedCalendars" :tags="tags" :loading="loading" @appointments-updated="loadAppointments"
            @calendars-updated="loadCalendars" @tags-updated="loadTags" :editingCalendar="editingCalendar"
            :showCalendarForm="showCalendarForm" @closeCalendarForm="closeCalendarForm" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import CalendarView from './CalendarView.vue';
import { calendarService } from '../assets/calendar.js';
import { calendarToICS, ICSToCalendar } from "../components/import_export/ICSCalendarConverter.js";
import { downloadTextFile, promptForFile } from "../components/import_export/FileHandler.js";

const router = useRouter();
const sidebarOpen = ref(true);
const appointments = ref([]);
const loading = ref(false);
const userName = ref('');
const calendarViewRef = ref(null);
const calendars = ref([]);
const sharedCalendars = ref([]);
const loadingCalendars = ref(false);
const appointmentsdisplayed = ref(true);
const calendarsdisplayed = ref(false);
const resetSearchKey = ref(0);
const resetFiltersKey = ref(0);
const filters = ref({});
const showCalendarForm = ref(false);
const editingCalendar = ref(null);
const tags = ref([]);
const loadingTags = ref(false);

onMounted(async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    router.push('/login');
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  try {
    // Load all calendars, make them visible by default
    await loadCalendars();
    await loadSharedCalendars();
    await loadTags();
    calendars.value.forEach((calendar) => {
      const isVisible = localStorage.getItem(`isVisible_${calendar.id}`);
      if (isVisible === null || isVisible.toLowerCase() === "true") {
        calendarService.visibleCalendars.add(calendar.id);
      }
    });
    sharedCalendars.value.forEach((calendar) => {
      const isVisible = localStorage.getItem(`isVisible_${calendar.id}`);
      if (isVisible === null || isVisible.toLowerCase() === "true") {
        calendarService.visibleCalendars.add(calendar.id);
      }
    });

    await loadAppointments();

    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      userName.value = storedUserName;
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      router.push('/login');
    }
  }
});

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

const viewCalendars = () => {
  calendarsdisplayed.value = true;
  appointmentsdisplayed.value = false;
};

const viewAppointments = () => {
  appointmentsdisplayed.value = true;
  calendarsdisplayed.value = false;
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    appointments.value = [];
    // Charger les rendez-vous des calendriers personnels
    calendars.value.forEach((calendar) => {
      if (calendarService.visibleCalendars.has(calendar.id)) {
        calendarService.fetchAppointments(calendar).then((result) => {
          appointments.value.push(...result);
        });
      }
    });
    // Charger les rendez-vous des calendriers partagés
    sharedCalendars.value.forEach((calendar) => {
      if (calendarService.visibleCalendars.has(calendar.id)) {
        calendarService.fetchAppointments(calendar).then((result) => {
          appointments.value.push(...result);
        });
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error);
    throw error;
  } finally {
    loading.value = false;
  }
};

const loadSharedCalendars = async () => {
  try {
    const response = await axios.get('/api/share/shared-with-me');
    const shares = response.data.shares || [];

    // Récupérer les détails de chaque calendrier partagé
    const calendarPromises = shares.map(async (share) => {
      try {
        const calendarResponse = await axios.get(`/api/calendar/${share.calendarId}`);
        return {
          ...calendarResponse.data,
          isShared: true,
          ownerId: share.ownerId
        };
      } catch (error) {
        console.error(`Erreur lors de la récupération du calendrier ${share.calendarId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(calendarPromises);
    sharedCalendars.value = results.filter(cal => cal !== null);
  } catch (error) {
    console.error('Erreur lors du chargement des calendriers partagés:', error);
    sharedCalendars.value = [];
  }
};

const handleLogout = async () => {
  try {
    await axios.delete(`/api/auth/logout/${localStorage.getItem('userName')}`, {});
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    delete axios.defaults.headers.common['Authorization'];
    router.push('/login');
  }
};

const handleSelectAppointment = (appointment) => {
  if (calendarViewRef.value) {
    calendarViewRef.value.goToAppointment(appointment);
  }
};

const handleSearch = async (query) => {
  loading.value = true;
  try {
    if (!query.trim()) {
      await loadAppointments();
    } else {
      appointments.value = [];
      calendars.value.forEach((calendar) => {
        if (calendarService.visibleCalendars.has(calendar.id)) {
          calendarService.searchAppointments(query, calendar).then((result) => {
            appointments.value.push(...result);
          });
        }
      });
      sharedCalendars.value.forEach((calendar) => {
        if (calendarService.visibleCalendars.has(calendar.id)) {
          calendarService.searchAppointments(query, calendar).then((result) => {
            appointments.value.push(...result);
          });
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche :', error);
  } finally {
    loading.value = false;
  }
};

// Quand les filtres changent
const handleFilters = (newFilters) => {
  filters.value = newFilters
}

// calcule les rdv avec les filtres appliqué
const filteredAppointments = computed(() => {
  return appointments.value
      .map((a) => {
        let matches = true;

        // Filtre mot-clé
        if (filters.value.keyword) {
          const q = filters.value.keyword.toLowerCase();
          const text = `${a.title ?? ''} ${a.description ?? ''} ${a.location ?? ''}`.toLowerCase();
          matches = text.includes(q);
        }

        // Filtre date début
        if (matches && filters.value.startDate) {
          const start = new Date(a.startDate);
          const filterStart = new Date(filters.value.startDate);
          matches = filters.value.startOperator === '>' ? start > filterStart : start < filterStart;
        }

        // Filtre date fin
        if (matches && filters.value.endDate) {
          const end = new Date(a.endDate);
          const filterEnd = new Date(filters.value.endDate);
          matches = filters.value.endOperator === '>' ? end > filterEnd : end < filterEnd;
        }

        // Filtre tags
        if (matches && filters.value.selectedTags && filters.value.selectedTags.length > 0) {
          const appointmentTags = a.tags || [];
          matches = filters.value.selectedTags.some(tagId =>
              appointmentTags.map(String).includes(String(tagId))
          );
        }

        // Filtre récurrence
        if (matches && filters.value.showRecurring === false) {
          matches = !(a.recursionRule !== undefined && a.recursionRule !== null);
        }

        return {
          ...a,
          isDimmed: !matches  // On ajoute une ligne pour pouvoir grisé ou non les rdv
        };
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
});


const openCalendarForm = (id, name, description, color) => {
  editingCalendar.value = { id, name, description, color };
  showCalendarForm.value = true;
};

const closeCalendarForm = async () => {
  showCalendarForm.value = false;
  editingCalendar.value = null;
  await loadCalendars();
  await loadSharedCalendars();
  await loadAppointments();
  await loadTags();
  resetSearchKey.value++; // Réinitialise la barre de recherche
  resetFiltersKey.value++; // réinitialise les filtres
  filters.value = {}; // Réinitialise les filtres
};

const handleSelectCalendar = async () => {
};

const deleteCalendar = async (calendarId) => {
  if (calendars.value.length > 1) {
    try {
      calendars.value = await calendarService.deleteCalendar(calendarId);

      // Remove the calendar from visible ones
      localStorage.removeItem(`isVisible_${calendarId}`);
      calendarService.visibleCalendars.delete(calendarId);
    } catch (error) {
      console.error('Erreur lors de la suppression du calendrier:', error);
    } finally {
      await loadCalendars();
      await loadAppointments();
    }
  }
};

const exportCalendar = async (calendar, appointments) => {
  appointments = await calendarService.getAppointmentsByCalendarId(calendar);
  let icsFile = calendarToICS(calendar, appointments);
  downloadTextFile(`${calendar.name}.ics`, icsFile);
}

const importCalendar = async () => {
  try {
    let file = await (await promptForFile(".ics, .ical, .icalendar"))[0].text();

    const res = ICSToCalendar(file);
    res.calendar = await calendarService.createCalendar(res.calendar);

    res.appointments.forEach((appointment) => {
      appointment.calendarId = res.calendar.id;
      if (appointment.recursionRule) {
        calendarService.createRecurrentAppointment(appointment);
      } else {
        calendarService.createAppointment(appointment);
      }
    });

    await calendarToggled(res.calendar.id, true);
  } catch (error) {
    console.error('Erreur lors de l\'import du calendrier:', error);
  }
}

const loadCalendars = async () => {
  loadingCalendars.value = true;
  try {
    calendars.value = await calendarService.getCalendarsByOwnerId();
  } catch (error) {
    console.error('Erreur lors du chargement des calendriers:', error);
    throw error;
  } finally {
    loadingCalendars.value = false;
  }
};

const loadTags = async () => {
  loadingTags.value = true;
  try {
    tags.value = await calendarService.getTags();
  } catch (error) {
    console.error('Erreur lors du chargement des tags:', error);
    throw error;
  } finally {
    loadingTags.value = false;
  }
};

const openTagForm = (tag = null) => {
  if (calendarViewRef.value) {
    calendarViewRef.value.openTagForm(tag);
  }
};

const deleteTag = async (tagId) => {
  try {
    await calendarService.deleteTag(tagId);
    await loadTags();
  } catch (error) {
    console.error('Erreur lors de la suppression du tag:', error);
    alert('Erreur lors de la suppression du tag');
  }
};

const calendarToggled = async (calendarId, value) => {
  localStorage.setItem(`isVisible_${calendarId}`, value);
  if (value) {
    calendarService.visibleCalendars.add(calendarId);
  } else {
    calendarService.visibleCalendars.delete(calendarId);
  }

  await loadCalendars();
  await loadSharedCalendars();
  await loadAppointments();
}

const handleRemoveSharedCalendar = async (calendarId) => {
  // Retirer le calendrier de la liste locale immédiatement
  sharedCalendars.value = sharedCalendars.value.filter(c => c.id !== calendarId);

  // Retirer de la visibilité
  localStorage.removeItem(`isVisible_${calendarId}`);
  calendarService.visibleCalendars.delete(calendarId);

  // Recharger les rendez-vous pour exclure ceux du calendrier supprimé
  await loadAppointments();
};
</script>