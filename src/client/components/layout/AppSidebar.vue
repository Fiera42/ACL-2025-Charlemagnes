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

      <!-- Liste des rendez-vous -->
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
  </aside>
</template>

<script setup>
import {computed} from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  appointments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close', 'selectAppointment']);

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