<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="previousDay" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        ← Précédent
      </button>
      <h2 class="text-xl font-semibold">
        {{ dayLabel }}
      </h2>
      <button @click="nextDay" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        Suivant →
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500">
      Chargement...
    </div>
    <div v-else class="relative">
      <!-- Grille horaire -->
      <div class="grid grid-cols-1">
        <div
          v-for="hour in hours"
          :key="hour"
          class="flex border-t border-gray-200"
        >
          <div class="w-20 p-3.5 flex items-start text-xs font-semibold text-gray-400">
            {{ hour }}
          </div>
          <div
            class="flex-1 p-3.5 transition-all hover:bg-stone-100 cursor-pointer min-h-[80px]"
            @click="$emit('newEvent', currentDate, hour)"
          >
            <div class="space-y-1">
              <CalendarEvent
                v-for="event in getHourEvents(hour)"
                :key="event.id"
                :title="event.title"
                :time="event.time"
                :color-class="event.colorClass"
                :text-color="event.textColor"
                @click.stop="$emit('editEvent', event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CalendarEvent from './CalendarEvent.vue';

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['newEvent', 'editEvent']);

const currentDate = ref(new Date());

const hours = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const dayLabel = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
});

const getHourEvents = (hour) => {
  const [hourNum] = hour.split(':').map(Number);
  return props.events.filter(event => {
    const eventDate = new Date(event.startDate);
    const eventHour = eventDate.getHours();
    return eventDate.toDateString() === currentDate.value.toDateString() && eventHour === hourNum;
  });
};

const previousDay = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 1));
};

const nextDay = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 1));
};

defineExpose({
  goToDate: (date) => {
    currentDate.value = new Date(date);
  }
});
</script>