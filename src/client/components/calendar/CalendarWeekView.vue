<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="previousWeek"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        ← Précédent
      </button>
      <h2 class="text-xl font-semibold">
        {{ weekLabel }}
      </h2>
      <button @click="nextWeek"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        Suivant →
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500">
      Chargement...
    </div>
    <div v-else class="relative">
      <!-- En-tête des jours -->
      <div class="grid grid-cols-8 border-t border-gray-200 sticky top-0 left-0 w-full bg-white">
        <div class="p-3.5 flex items-center justify-center text-sm font-medium text-gray-900"></div>
        <div
            v-for="day in weekDays"
            :key="day.date"
            class="p-3.5 flex items-center justify-center text-sm font-medium"
            :class="isToday(day.date) ? 'text-indigo-600' : 'text-gray-900'"
        >
          {{ day.label }}
        </div>
      </div>

      <!-- Grille horaire - Desktop -->
      <div class="hidden sm:grid grid-cols-8 w-full overflow-x-auto">
        <template v-for="hour in hours" :key="hour">
          <div class="h-28 p-3.5 border-t border-r border-gray-200 flex items-end transition-all hover:bg-stone-100">
            <span class="text-xs font-semibold text-gray-400">{{ hour }}</span>
          </div>
          <div
              v-for="day in weekDays"
              :key="`${hour}-${day.date}`"
              class="h-28 p-0.5 md:p-3.5 border-t border-gray-200 transition-all hover:bg-stone-100 cursor-pointer"
              :class="day.isLastDay ? '' : 'border-r'"
              @click="$emit('newEvent', day.date, hour)"
          >
            <CalendarEvent
                v-for="event in getHourEvents(day.date, hour)"
                :key="event.id"
                :title="event.title"
                :time="event.time"
                :color-class="event.colorClass"
                :text-color="event.textColor"
                @click.stop="$emit('editEvent', event)"
            />
          </div>
        </template>
      </div>

      <!-- Grille horaire - Mobile -->
      <div class="flex sm:hidden border-t border-gray-200 items-start w-full">
        <div class="flex flex-col">
          <div
              v-for="hour in hours"
              :key="hour"
              class="w-20 h-20 p-2 flex items-end text-xs font-semibold text-gray-400 border-b border-r border-gray-200"
          >
            {{ hour }}
          </div>
        </div>
        <div class="grid grid-cols-1 w-full">
          <div
              v-for="hour in hours"
              :key="hour"
              class="w-full h-20 border-b border-gray-200 p-1.5"
          >
            <CalendarEvent
                v-for="event in getMobileHourEvents(hour)"
                :key="event.id"
                :title="event.title"
                :time="event.time"
                :color-class="event.colorClass"
                :text-color="event.textColor"
                class="w-full h-full"
                @click="$emit('editEvent', event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue';
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

const weekDays = computed(() => {
  const start = new Date(currentDate.value);
  start.setDate(start.getDate() - start.getDay() + 1);

  return Array.from({length: 7}, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return {
      date,
      label: date.toLocaleDateString('fr-FR', {month: 'short', day: 'numeric'}),
      isLastDay: i === 6
    };
  });
});

const weekLabel = computed(() => {
  const first = weekDays.value[0].date;
  const last = weekDays.value[6].date;
  return `${first.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long'
  })} - ${last.toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}`;
});

const getHourEvents = (date, hour) => {
  const [hourNum] = hour.split(':').map(Number);
  return props.events.filter(event => {
    const eventDate = new Date(event.startDate);
    const eventHour = eventDate.getHours();
    return eventDate.toDateString() === date.toDateString() && eventHour === hourNum;
  });
};

const getMobileHourEvents = (hour) => {
  const [hourNum] = hour.split(':').map(Number);
  return props.events.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.getHours() === hourNum;
  });
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const previousWeek = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 7));
};

const nextWeek = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 7));
};

defineExpose({
  goToDate: (date) => {
    currentDate.value = new Date(date);
  }
});
</script>