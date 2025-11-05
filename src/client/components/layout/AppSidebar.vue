<template>
  <!-- Overlay -->
  <div
      v-if="isOpen"
      class="fixed inset-0 bg-opacity-50 z-40"
      @click="$emit('close')"
  ></div>

  <!-- Sidebar -->
  <aside
      :class="[
        'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out w-80',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
  >
    <div class="flex flex-col h-full">
      <!-- Header du sidebar -->
      <div class ="flex gap-5">
        <button
            class="py-2.5 pr-7 pl-5 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
            @click="$emit('toggleappointmentsdisplay')"
        >
          Rendez-vous
        </button>

        <button
            class="py-2.5 pr-7 pl-5 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
            @click="$emit('togglecalendarsdisplay')"
        >
          Calendriers
        </button>
      </div>
      
          <!-- Liste des rendez-vous -->
      <div v-if="props.appointmentsdisplayed">

        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Rendez-vous à venir</h2>
          <button
              @click="$emit('close')"
              class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="loading" class="text-center text-gray-500 py-8">
            Chargement...
          </div>
          <div v-else-if="upcomingAppointments.length === 0" class="text-center text-gray-500 py-8">
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
                class="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                @click="$emit('selectAppointment', appointment)"
            >
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-gray-900 text-sm truncate flex-1">{{ appointment.title }}</h3>
                <span class="text-xs font-semibold text-indigo-600 ml-2">{{ appointment.hour }}</span>
              </div>
              <p v-if="appointment.description" class="text-xs text-gray-600 mb-2 line-clamp-2">
                {{ appointment.description }}
              </p>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
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
      <div v-else-if="props.calendarsdisplayed">

      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Liste des calendriers</h2>
        <button
            @click="$emit('close')"
            class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

        <div class="flex-1 overflow-y-auto p-4">
          <button
            class="py-2.5 pr-7 pl-5 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
            @click="$emit('CalendarForm')"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 5V15M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
            Nouveau calendrier
          </button>

          <div v-if="loadingCalendars" class="text-center text-gray-500 py-8">
            Chargement...
          </div>
          
          <div v-else-if="calendars.length === 0" class="text-center text-gray-500 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                class="mx-auto mb-3 text-gray-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p class="text-sm">Aucun calendrier</p>
          </div>
          
          <div v-else class="space-y-3">
            <div
                v-for="calendar in props.calendars"
                :key="calendar.id"
                class="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                @click="$emit('selectCalendar', calendar)"
            >
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-gray-900 text-sm truncate flex-1">{{ calendar.name }}</h3>
              </div>

              <p v-if="calendar.description" class="text-xs text-gray-600 mb-2 line-clamp-2">
                {{ calendar.description }}
              </p>
              
              <button
                class="py-2.5 pr-7 pl-5 bg-red-500 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-red-600"
                @click="$emit('deleteCalendar',calendar.id)"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
                Supprimer
              </button>

              <button
                class="py-2.5 pr-7 pl-5 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
                @click="$emit('editCalendar',calendar.id,calendar.name,calendar.description,calendar.color)"
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 5V15M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              Modifier
              </button>

              
              
              <!-- <div class="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{{ appointment.dateLabel }}</span>
              </div> -->
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </aside>
</template>

<script setup>
import {computed} from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  appointmentsdisplayed: {
    type: Boolean,
    default: false
  },
  calendarsdisplayed: {
    type: Boolean,
    default: false
  },
  appointments: {
    type: Array,
    default: () => []
  },
  calendars: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingCalendars: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close','selectAppointment','toggleappointmentsdisplay','togglecalendarsdisplay','CalendarForm','editCalendar']);

const upcomingAppointments = computed(() => {
  const now = new Date();
  return props.appointments
      .filter(appt => new Date(appt.startDate) > now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 10)
      .map(appt => ({
        ...appt,
        dateLabel: new Date(appt.startDate).toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
      }));
});
</script>