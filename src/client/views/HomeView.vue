<template>
  <div id="app" class="min-h-screen bg-stone-50 flex flex-col">
    <AppHeader
        :user-name="userName"
        @toggle-sidebar="toggleSidebar"
        @logout="handleLogout"
    />

    <div class="flex flex-1 relative">
      <AppSidebar
          :is-open="sidebarOpen"
          :appointments="appointments"
          :appointmentsdisplayed="appointmentsdisplayed"
          :loading="loading"
          :loadingCalendars="loadingCalendars"
          :calendars="calendars"
          :calendarsdisplayed="calendarsdisplayed"
          @toggleappointmentsdisplay="viewAppointments"
          @togglecalendarsdisplay="viewCalendars"
          @close="closeSidebar"
          @select-appointment="handleSelectAppointment"
          @selectCalendar="handleSelectCalendar"
          @CalendarForm="openCalendarForm"
          @deleteCalendar="deleteCalendar"
          @editCalendar="openCalendarForm"
      />

      <main
          :class="[
                  'flex-1 transition-all duration-300',
                  sidebarOpen ? 'ml-80' : 'ml-0'
                ]"
      >
        <div class="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <CalendarView
              ref="calendarViewRef"
              :appointments="appointments"
              :loading="loading"
              @appointments-updated="loadAppointments"
              :editingCalendar="editingCalendar"
              :showCalendarForm="showCalendarForm"
              @closeCalendarForm="closeCalendarForm"
              @calendarsUpdated="loadCalendars"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import axios from 'axios';
import {useRouter} from 'vue-router';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import CalendarView from './CalendarView.vue';
import {calendarService} from '../assets/calendar.js';

const router = useRouter();
const sidebarOpen = ref(false);
const appointments = ref([]);
const loading = ref(false);
const userName = ref('');
const calendarViewRef = ref(null);
const calendars = ref([]);
const loadingCalendars = ref(false);
const appointmentsdisplayed = ref(true);
const calendarsdisplayed = ref(false);
const showCalendarForm = ref(false);
const editingCalendar = ref(null);

onMounted(async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    router.push('/login');
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  try {
    await loadAppointments();
    await loadCalendars();

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
    appointments.value = await calendarService.fetchAppointments();
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error);
    throw error;
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await axios.delete('/api/auth/logout');
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
  closeSidebar();
  if (calendarViewRef.value) {
    calendarViewRef.value.goToAppointment(appointment);
  }
};

const openCalendarForm = (id, name, description, color) => {
  editingCalendar.value = {id, name, description, color};
  showCalendarForm.value = true;
};

const closeCalendarForm = () => {
  showCalendarForm.value = false;
  editingCalendar.value = null;
};

const handleSelectCalendar = async () => {
};

const deleteCalendar = async (calendarId) => {
  if (calendars.value.length > 1) {
    try {
      calendars.value = await calendarService.deleteCalendar(calendarId);
    } catch (error) {
      console.error('Erreur lors de la suppression du calendrier:', error);
    } finally {
      loadCalendars();
    }
  }
};

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
</script>