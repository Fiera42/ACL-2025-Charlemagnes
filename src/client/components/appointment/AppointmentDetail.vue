<template>
  <BaseModal @close="$emit('close')">
    <div class="flex items-start justify-between mb-4">
      <h2 class="text-xl font-bold">{{ appointment.title }}</h2>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" class="mt-0.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="text-sm text-gray-700">{{ formatDateRange(appointment.startDate, appointment.endDate) }}</span>
      </div>

      <div class="flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" class="mt-0.5">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="text-sm text-gray-700">{{ formatTimeRange(appointment.startDate, appointment.endDate) }}</span>
      </div>

      <div v-if="appointment.description" class="flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" class="mt-0.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="text-sm text-gray-700">{{ appointment.description }}</span>
      </div>

      <div v-if="appointment.recursionRule !== undefined && appointment.recursionRule !== null" class="flex items-start gap-2 text-sm text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <polyline points="7 23 3 19 7 15"></polyline>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
        <span class="text-sm text-gray-700">Récurrence : {{ readableRecursionRule }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <button @click="$emit('edit')" class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
        Modifier
      </button>
      <button @click="$emit('delete')" class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
        Supprimer
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from '../common/BaseModal.vue';
import { computed } from 'vue';

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  }
});

defineEmits(['close', 'edit', 'delete']);

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay.setHours(0, 0, 0, 0);

  if (startDay.getTime() === endDay.getTime()) {
    return startDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } else {
    const startFormatted = startDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const endFormatted = endDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return `${startFormatted} → ${endFormatted}`;
  }
};

const formatTimeRange = (start, end) => {
  const startTime = new Date(start).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const endTime = new Date(end).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${startTime} - ${endTime}`;
};

const ruleLabels = ["Quotidienne", "Hebdomadaire", "Mensuelle", "Annuelle"];

const readableRecursionRule = computed(() => {
  if (props.appointment.recursionRule === null || props.appointment.recursionRule === undefined) return "Aucune";
  return ruleLabels[props.appointment.recursionRule];
});

</script>