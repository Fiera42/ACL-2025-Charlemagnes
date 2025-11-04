<template>
  <section class="relative">
    <CalendarHeader
        :current-date-label="currentDateLabel"
        :current-view="currentView"
        :current-date="currentDate"
        @change-view="changeView"
        @new-event="openNewEventForm"
        @go-to-today="goToToday"
        @date-change="handleDateChange"
    />

    <CalendarDayView
        v-if="currentView === 'day'"
        ref="dayViewRef"
        :events="appointments"
        :loading="loading"
        @new-event="openNewEventForm"
        @show-event="showEventDetail"
    />

    <CalendarWeekView
        v-else-if="currentView === 'week'"
        ref="weekViewRef"
        :events="appointments"
        :loading="loading"
        @new-event="openNewEventForm"
        @show-event="showEventDetail"
    />

    <CalendarMonthView
        v-else
        ref="monthViewRef"
        :events="appointments"
        :loading="loading"
        @new-event="openNewEventForm"
        @show-event="showEventDetail"
    />

    <AppointmentForm
        v-if="showForm"
        :appointment="editingAppointment"
        @close="closeForm"
        @save="saveAppointment"
    />

    <AppointmentDetail
        v-if="showDetail"
        :appointment="selectedAppointment"
        @close="closeDetail"
        @edit="editAppointment"
        @delete="deleteAppointment"
    />
  </section>
</template>

<script setup>
import {ref, computed} from 'vue';
import CalendarHeader from '../components/calendar/CalendarHeader.vue';
import CalendarDayView from '../components/calendar/CalendarDayView.vue';
import CalendarWeekView from '../components/calendar/CalendarWeekView.vue';
import CalendarMonthView from '../components/calendar/CalendarMonthView.vue';
import AppointmentForm from '../components/appointment/AppointmentForm.vue';
import AppointmentDetail from '../components/appointment/AppointmentDetail.vue';
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
const currentDate = ref(new Date());
const showForm = ref(false);
const showDetail = ref(false);
const editingAppointment = ref(null);
const selectedAppointment = ref(null);
const dayViewRef = ref(null);
const weekViewRef = ref(null);
const monthViewRef = ref(null);

const currentDateLabel = computed(() => {
  const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
  return currentDate.value.toLocaleDateString('fr-FR', options);
});

const handleDateChange = (newDate) => {
  currentDate.value = new Date(newDate);
  updateCurrentViewDate();
};

const updateCurrentViewDate = () => {
  if (currentView.value === 'day' && dayViewRef.value) {
    dayViewRef.value.goToDate(currentDate.value);
  } else if (currentView.value === 'week' && weekViewRef.value) {
    weekViewRef.value.goToDate(currentDate.value);
  } else if (currentView.value === 'month' && monthViewRef.value) {
    monthViewRef.value.goToDate(currentDate.value);
  }
};

const goToToday = () => {
  currentDate.value = new Date();
  updateCurrentViewDate();
};

const changeView = (view) => {
  currentView.value = view;
  setTimeout(updateCurrentViewDate, 50);
};

const openNewEventForm = (date, hour) => {
  let startDate = new Date(date || currentDate.value);

  if (hour) {
    const [hours, minutes] = hour.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    startDate.setHours(9, 0, 0, 0);
  }

  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  editingAppointment.value = {
    title: '',
    description: '',
    startDate: startDate.toISOString().slice(0, 16),
    endDate: endDate.toISOString().slice(0, 16)
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingAppointment.value = null;
};

const saveAppointment = async (appointment) => {
  try {
    const appointmentData = {
      ...appointment,
      startDate: new Date(appointment.startDate),
      endDate: new Date(appointment.endDate)
    };

    if (editingAppointment.value?.id) {
      await calendarService.updateAppointment({
        id: editingAppointment.value.id,
        ...appointmentData
      });
    } else {
      await calendarService.createAppointment(appointmentData);
    }

    emit('appointmentsUpdated');
    closeForm();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde du rendez-vous');
  }
};

const showEventDetail = (appointment) => {
  selectedAppointment.value = appointment;
  showDetail.value = true;
};

const closeDetail = () => {
  showDetail.value = false;
  selectedAppointment.value = null;
};

const editAppointment = () => {
  editingAppointment.value = {
    id: selectedAppointment.value.id,
    title: selectedAppointment.value.title,
    description: selectedAppointment.value.description,
    startDate: new Date(selectedAppointment.value.startDate).toISOString().slice(0, 16),
    endDate: new Date(selectedAppointment.value.endDate).toISOString().slice(0, 16)
  };
  showDetail.value = false;
  showForm.value = true;
};

const deleteAppointment = async () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
    try {
      await calendarService.deleteAppointment(selectedAppointment.value.id);
      emit('appointmentsUpdated');
      closeDetail();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du rendez-vous');
    }
  }
};

const goToAppointment = (appointment) => {
  const appointmentDate = new Date(appointment.startDate);
  currentDate.value = appointmentDate;
  currentView.value = 'day';
  setTimeout(() => {
    if (dayViewRef.value) {
      dayViewRef.value.goToDate(appointmentDate);
    }
  }, 50);
};

defineExpose({
  goToAppointment
});
</script>