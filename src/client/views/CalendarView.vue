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
        :calendars="calendars"
        :tags="tags"
        @close="closeForm"
        @save="saveAppointment"
    />

    <TagForm
        v-if="showTagForm"
        :tag="editingTag"
        @close="closeTagForm"
        @save="saveTag"
    />

    <CalendarCreationForm
        v-if="showCalendarForm"
        :calendar="props.editingCalendar"
        @create="saveCalendar"
        @close="closeCalendarForm"
        @save="saveCalendar"
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

<script setup lang="ts">
import {ref, computed, onMounted, onBeforeUnmount} from 'vue';
import CalendarHeader from '../components/calendar/CalendarHeader.vue';
import CalendarDayView from '../components/calendar/CalendarDayView.vue';
import CalendarWeekView from '../components/calendar/CalendarWeekView.vue';
import CalendarMonthView from '../components/calendar/CalendarMonthView.vue';
import AppointmentForm from '../components/appointment/AppointmentForm.vue';
import AppointmentDetail from '../components/appointment/AppointmentDetail.vue';
import {calendarService} from '../assets/calendar.js';
import CalendarCreationForm from '../components/calendar/CalendarCreationForm.vue';
import { RecursionRule } from '../../domain/entities/RecursionRule.js'
import TagForm from '../components/tag/TagForm.vue';

const props = defineProps({
  calendars: {
    type: Array,
    default: () => []
  },
  appointments: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showCalendarForm: {
    type: Boolean,
    default: false
  },
  editingCalendar: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['appointmentsUpdated','closeCalendarForm','calendarsUpdated','tagsUpdated']);

const currentView = ref('day');
const currentDate = ref(new Date());
const showForm = ref(false);
const showDetail = ref(false);
const editingAppointment = ref(null);
const selectedAppointment = ref(null);
const dayViewRef = ref(null);
const weekViewRef = ref(null);
const monthViewRef = ref(null);
const showTagForm = ref(false);
const editingTag = ref(null);

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
  endDate.setHours(endDate.getHours() + (-(new Date().getTimezoneOffset() /60)));

  editingAppointment.value = {
    title: '',
    description: '',
    calendarId: props.calendars[0].id,
    tags: [],
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
    const startDate = new Date(appointment.startDate);
    const endDate = new Date(appointment.endDate);

    if (editingAppointment.value?.id) {
      await calendarService.updateAppointment({
        id: editingAppointment.value.id,
        title: appointment.title,
        description: appointment.description,
        startDate,
        endDate,
        calendarId: appointment.calendarId,
        tags: appointment.tags,
        recursionRule: RecursionRule[appointment.recursionRule] ?? null
      });
    } else {
      if (appointment.isRecurring) {
        await calendarService.createRecurrentAppointment({
          title: appointment.title,
          description: appointment.description,
          startDate,
          endDate,
          calendarId: appointment.calendarId,
          recursionRule: RecursionRule[appointment.recursionRule]
        });
      } else {
        await calendarService.createAppointment({
          title: appointment.title,
          description: appointment.description,
          startDate,
          endDate,
          tags: appointment.tags,
          calendarId: appointment.calendarId
        });
      }
    }

    emit('appointmentsUpdated');
    closeForm();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde du rendez-vous');
  }
};

const closeCalendarForm = () => {
  emit('closeCalendarForm');
};

const saveCalendar = async (calendar) => {
  try {
    if (calendar.id) {
      await calendarService.updateCalendar(calendar);
    } else {
      await calendarService.createCalendar({
        name: calendar.name,
        description: calendar.description,
        color: calendar.color
      });

      // Calendar is selected by default
      localStorage.setItem(`isVisible_${calendar.id}`, "true");
      calendarService.visibleCalendars.add(calendar.id);
    }
    emit('calendarsUpdated');
    closeCalendarForm();
  } catch (error) {
    console.log(error);
    alert('Impossible de créer le calendrier');
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

// Méthode pour convertir une date en ISO sans décalage horaire
const DateSansDecalage = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};


const editAppointment = () => {
  editingAppointment.value = {
    id: selectedAppointment.value.id,
    title: selectedAppointment.value.title,
    description: selectedAppointment.value.description,
    calendarId: selectedAppointment.value.calendarId,
    startDate: DateSansDecalage(selectedAppointment.value.startDate),
    endDate: DateSansDecalage(selectedAppointment.value.endDate),
    isRecurring: selectedAppointment.value.recursionRule !== undefined && selectedAppointment.value.recursionRule !== null,
    recursionRule: selectedAppointment.value.recursionRule ?? null,
    tags: selectedAppointment.value.tags || []
  };
  showDetail.value = false;
  showForm.value = true;
};

const deleteAppointment = async () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
    try {
      await calendarService.deleteAppointment(selectedAppointment.value.id, selectedAppointment.value.recursionRule);
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
      dayViewRef.value.scrollToAppointmentTime(appointmentDate);
    }
  }, 50);
};

const saveTag = async (tagData) => {
  try {
    console.log('CalendarView saveTag received:', tagData);
    if (tagData.id) {
      const { name, color } = tagData;
      await calendarService.updateTag(tagData.id, { name, color });
    } else {
      const { name, color } = tagData;
      await calendarService.createTag({ name, color });
    }
    emit('tagsUpdated');
    closeTagForm();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du tag :', error);
    alert('Erreur lors de la sauvegarde du tag');
  }
};

const closeTagForm = () => {
  showTagForm.value = false;
  editingTag.value = null;
};

const openTagForm = (tag = null) => {
  editingTag.value = tag;
  showTagForm.value = true;
};

const handleGlobalTagForm = (event) => {
  const customEvent = event as CustomEvent;
  openTagForm(customEvent?.detail ?? null);
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('open-tag-form', handleGlobalTagForm as EventListener);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('open-tag-form', handleGlobalTagForm as EventListener);
  }
});

defineExpose({
  goToAppointment,
  openTagForm
});
</script>