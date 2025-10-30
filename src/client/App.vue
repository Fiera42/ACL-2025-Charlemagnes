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
          :loading="loading"
          @close="closeSidebar"
          @select-appointment="handleSelectAppointment"
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
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import AppHeader from './components/layout/AppHeader.vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import CalendarView from './views/CalendarView.vue';
import {calendarService} from './assets/calendar.js';

const sidebarOpen = ref(false);
const appointments = ref([]);
const loading = ref(false);
const userName = ref('Utilisateur');
const calendarViewRef = ref(null);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    appointments.value = await calendarService.fetchAppointments();
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error);
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

const handleSelectAppointment = (appointment) => {
  closeSidebar();
  if (calendarViewRef.value) {
    calendarViewRef.value.goToAppointment(appointment);
  }
};

onMounted(() => {
  loadAppointments();

  const storedUserName = localStorage.getItem('userName');
  if (storedUserName) {
    userName.value = storedUserName;
  }
});
</script>