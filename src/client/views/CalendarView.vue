<template>
  <section class="relative">
    <div class="w-full">
      <CalendarHeader
          :current-date-label="currentDateLabel"
          :current-view="currentView"
          @change-view="changeView"
          @new-event="openNewEventForm"
          @go-to-today="goToToday"
      />

      <CalendarDayView
          v-if="currentView === 'day'"
          ref="dayViewRef"
          :events="appointments"
          :loading="loading"
          @new-event="openNewEventForm"
          @edit-event="editEvent"
      />

      <CalendarWeekView
          v-else-if="currentView === 'week'"
          ref="weekViewRef"
          :events="appointments"
          :loading="loading"
          @new-event="openNewEventForm"
          @edit-event="editEvent"
      />

      <CalendarMonthView
          v-else
          ref="monthViewRef"
          :events="appointments"
          :loading="loading"
          @new-event="openNewEventForm"
          @edit-event="editEvent"
      />

      <AppointmentForm
          v-if="showAppointmentForm"
          :appointment="editingAppointment"
          @close="closeForm"
          @save="saveAppointment"
      />
    </div>
  </section>
</template>

<script setup>
import {ref, computed} from 'vue';
import CalendarHeader from '../components/calendar/CalendarHeader.vue';
import CalendarDayView from '../components/calendar/CalendarDayView.vue';
import CalendarWeekView from '../components/calendar/CalendarWeekView.vue';
import CalendarMonthView from '../components/calendar/CalendarMonthView.vue';
import AppointmentForm from '../components/appointment/AppointmentForm.vue';
import {calendarService} from '../assets/calendar.js';

const props = defineProps({
  appointments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['appointmentsUpdated']);

const currentView = ref('day');
const showAppointmentForm = ref(false);
const editingAppointment = ref(null);

const dayViewRef = ref(null);
const weekViewRef = ref(null);
const monthViewRef = ref(null);

const currentDateLabel = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
});

const changeView = (view) => {
  currentView.value = view;
};

const goToToday = () => {
  const today = new Date();

  if (currentView.value === 'day' && dayViewRef.value) {
    dayViewRef.value.goToDate(today);
  } else if (currentView.value === 'week' && weekViewRef.value) {
    weekViewRef.value.goToDate(today);
  } else if (currentView.value === 'month' && monthViewRef.value) {
    monthViewRef.value.goToDate(today);
  }
};

const goToAppointment = (appointment) => {
  const appointmentDate = new Date(appointment.startDate);

  if (currentView.value === 'day' && dayViewRef.value) {
    dayViewRef.value.goToDate(appointmentDate);
  } else if (currentView.value === 'week' && weekViewRef.value) {
    weekViewRef.value.goToDate(appointmentDate);
  } else if (currentView.value === 'month' && monthViewRef.value) {
    monthViewRef.value.goToDate(appointmentDate);
  }
};

const openNewEventForm = (date, hour) => {
  editingAppointment.value = {date, hour};
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
      await calendarService.updateAppointment({...appointment, id: editingAppointment.value.id});
    } else {
      await calendarService.createAppointment({
        title: appointment.title,
        description: appointment.description,
        startDate: new Date(appointment.startDate),
        endDate: new Date(appointment.endDate)
      });
    }
    emit('appointmentsUpdated');
    closeForm();
  } catch (error) {
    alert('Impossible de sauvegarder le rendez-vous');
  }
};

defineExpose({
  goToAppointment
});
</script>