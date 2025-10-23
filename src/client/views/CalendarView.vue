<template>
  <div class="container mx-auto py-8">
    <h1 class="text-3xl font-bold text-center mb-8">📅 Calendrier</h1>

    <CalendarMonthView
        :events="events"
        :loading="loading"
        @newEvent="openNewEventForm"
        @editEvent="editEvent"
    />

    <AppointmentForm
        v-if="showAppointmentForm"
        :appointment="editingAppointment"
        @close="closeForm"
        @save="saveAppointment"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import CalendarMonthView from '../components/calendar/CalendarMonthView.vue';
import AppointmentForm from '../components/appointment/AppointmentForm.vue';
import { calendarService } from '../assets/calendar.js';

const showAppointmentForm = ref(false);
const editingAppointment = ref(null);
const events = ref([]);
const loading = ref(false);

const loadAppointments = async () => {
  loading.value = true;
  try {
    events.value = await calendarService.fetchAppointments();
  } catch (error) {
    alert('Impossible de charger les rendez-vous');
  } finally {
    loading.value = false;
  }
};

const openNewEventForm = (date) => {
  editingAppointment.value = { date };
  showAppointmentForm.value = true;
};

const editEvent = (event) => {
  editingAppointment.value = event;
  showAppointmentForm.value = true;
};

const closeForm = () => {
  showAppointmentForm.value = false;
  editingAppointment.value = null;
};

const saveAppointment = async (appointment) => {
  try {
    if (editingAppointment.value?.id) {
      await calendarService.updateAppointment(appointment);
    } else {
      await calendarService.createAppointment(appointment);
    }
    await loadAppointments();
    closeForm();
  } catch (error) {
    alert('Impossible de sauvegarder le rendez-vous');
  }
};

onMounted(() => {
  loadAppointments();
});
</script>