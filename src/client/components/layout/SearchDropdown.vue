<template>
  <div
      v-if="results.length > 0 && visible"
      class="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
  >
    <div
        v-for="appt in results"
        :key="appt.id"
        class="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-none"
        @click="select(appt)"
    >
      <div class="flex justify-between">
        <span class="text-sm font-medium text-gray-800 truncate">{{ appt.title }}</span>
        <span class="text-xs text-indigo-600">{{ formatDate(appt.startDate) }}</span>
      </div>
      <p v-if="appt.description" class="text-xs text-gray-500 truncate">{{ appt.description }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  results: Array,
  visible: Boolean
});

const emit = defineEmits(['select']);

const select = (appt) => {
  emit('select', appt);
};

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
</script>
