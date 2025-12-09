<template>
  <BaseModal @close="$emit('close')" :maxWidth="'600px'">
    <div class="flex flex-col max-h-[75vh]">
      <div class="flex-shrink-0 pb-4 border-b border-gray-200">
        <div class="flex-between">
          <h2 class="section-title flex-1 pr-4">
            {{ appointment.title }}
          </h2>
          <button 
            @click="$emit('close')" 
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto py-6 px-1">
        <div class="space-y-4">
          <div class="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" class="text-blue-600">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-blue-600 mb-1">Date</p>
              <p class="text-sm font-semibold text-gray-900">{{ formatDateRange(appointment.startDate, appointment.endDate) }}</p>
            </div>
          </div>

          <div class="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" class="text-green-600">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-green-600 mb-1">Horaire</p>
              <p class="text-sm font-semibold text-gray-900">{{ formatTimeRange(appointment. startDate, appointment.endDate) }}</p>
            </div>
          </div>

          <div v-if="appointment.description" class="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" class="text-purple-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-purple-600 mb-1">Description</p>
              <p class="text-sm text-gray-700 leading-relaxed">{{ appointment.description }}</p>
            </div>
          </div>

          <div v-if="appointmentTags.length > 0" class="flex items-start gap-3 p-3 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" class="text-cyan-600">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-cyan-600 mb-2">Tags</p>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="tag in appointmentTags" 
                  :key="tag.id"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                  :style="{ backgroundColor: tag.color }"
                >
                  <span class="opacity-80">@</span>
                  {{ tag.name }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="appointment. recursionRule !== undefined && appointment.recursionRule !== null" class="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-600">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-orange-600 mb-1">Récurrence</p>
              <p class="text-sm font-semibold text-gray-900">{{ readableRecursionRule }}</p>
            </div>
          </div>

          <div
              v-if="readableRecursionEnd"
              class="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-amber-200"
          >
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   fill="none" stroke="currentColor" stroke-width="2"
                   class="text-amber-600">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-amber-600 mb-1">Fin de la récurrence</p>
              <p class="text-sm font-semibold text-gray-900">
                Jusqu'au {{ readableRecursionEnd }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-shrink-0 pt-4 border-t border-gray-200">
        <div class="flex gap-3">
          <button 
            @click="$emit('edit')" 
            class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover: to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18. 5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Modifier
          </button>
          <button 
            @click="$emit('delete')" 
            class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Supprimer
          </button>
        </div>
      </div>
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
  },
  tags: {
    type: Array,
    default: () => []
  }
});

const appointmentTags = computed(() => {
  if (!props.appointment.tags || props.appointment.tags.length === 0) return [];
  
  return props.appointment.tags
    .map(tagId => props.tags.find(t => t.id === tagId))
    .filter(tag => tag !== undefined);
});

defineEmits(['close', 'edit', 'delete']);

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay. setHours(0, 0, 0, 0);

  if (startDay.getTime() === endDay.getTime()) {
    return startDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } else {
    const startFormatted = startDate.toLocaleDateString('fr-FR', {
      day:  'numeric',
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
    minute:  '2-digit'
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

const readableRecursionEnd = computed(() => {
  if (!props.appointment.recursionEndDate) return null;

  return new Date(props.appointment.recursionEndDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month:  "long",
    year: "numeric"
  });
});
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>