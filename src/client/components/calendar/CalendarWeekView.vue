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
      <div class="grid grid-cols-8 border-t border-gray-200 sticky top-0 left-0 w-full bg-white z-10">
        <div
            class="p-3.5 flex items-center justify-center text-sm font-medium text-gray-900 border-r border-gray-200"></div>
        <div
            v-for="day in weekDays"
            :key="day.date"
            :class="[
              'p-3.5 flex items-center justify-center text-sm font-medium border-r border-gray-200',
              isToday(day.date) ? 'text-indigo-600' : 'text-gray-900',
              !day.isLastDay && 'border-r'
            ]"
        >
          {{ day.label }}
        </div>
      </div>

      <!-- Grille horaire avec scroll -->
      <div ref="scrollContainer" class="relative overflow-y-auto max-h-[calc(100vh-350px)]">
        <div class="grid grid-cols-8">
          <template v-for="hour in hours" :key="hour">
            <div
                :ref="hour === '07:00' ? 'workStartRef' : undefined"
                class="h-20 p-2 border-t border-r border-gray-200 flex items-start text-xs font-semibold text-gray-400">
              {{ hour }}
            </div>
            <div
                v-for="(day, dayIndex) in weekDays"
                :key="`${hour}-${dayIndex}`"
                :class="[
                  'h-20 border-t border-gray-200 transition-all hover:bg-stone-100 cursor-pointer',
                  !day.isLastDay && 'border-r'
                ]"
                @click="$emit('newEvent', day.date, hour)"
            >
            </div>
          </template>
        </div>

        <!-- Événements positionnés en absolu -->
        <div
            v-for="(day, dayIndex) in weekDays"
            :key="`events-${dayIndex}`"
            class="absolute top-0 pointer-events-none"
            :style="{
              left: `calc(12.5% + ${dayIndex * 12.5}%)`,
              width: '12.5%'
            }"
        >
          <div
              v-for="event in getDayPositionedEvents(day.date)"
              :key="event.id"
              :style="{
                top: event.top + 'px',
                height: event.height + 'px'
              }"
              class="absolute left-0 right-0 px-1 pointer-events-auto"
          >
            <div
                :class="[
                  'rounded p-1.5 border-l-4 cursor-pointer h-full overflow-hidden',
                  event.colorClass
                ]"
                @click.stop="$emit('showEvent', event)"
            >
              <div class="flex items-start justify-between gap-1">
                <p class="text-xs font-medium text-gray-900 truncate flex-1">{{ event.title }}</p>
                <span
                    v-if="event.continuesBefore"
                    class="text-xs text-gray-600"
                    title="Continue depuis avant"
                >↑</span>
              </div>
              <p :class="['text-xs font-semibold', event.textColor]">{{ event.timeDisplay }}</p>
              <span
                  v-if="event.continuesAfter"
                  class="text-xs text-gray-600 block"
                  title="Continue après"
              >↓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, nextTick} from 'vue';

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

defineEmits(['newEvent', 'showEvent']);

const currentDate = ref(new Date());
const scrollContainer = ref(null);
const workStartRef = ref(null);

const hours = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00',
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00'
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

const getDayPositionedEvents = (date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return props.events
      .filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return eventStart < dayEnd && eventEnd > dayStart;
      })
      .map(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        const continuesBefore = eventStart < dayStart;
        const continuesAfter = eventEnd > dayEnd;

        const displayStart = continuesBefore ? dayStart : eventStart;
        const displayEnd = continuesAfter ? dayEnd : eventEnd;

        const startMinutes = displayStart.getHours() * 60 + displayStart.getMinutes();
        const endMinutes = displayEnd.getHours() * 60 + displayEnd.getMinutes();
        const top = (startMinutes / 60) * 80;
        const height = ((endMinutes - startMinutes) / 60) * 80;

        let timeDisplay = '';
        if (continuesBefore && continuesAfter) {
          timeDisplay = 'Toute la journée';
        } else if (continuesBefore) {
          timeDisplay = `... → ${displayEnd.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
        } else if (continuesAfter) {
          timeDisplay = `${displayStart.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} → ...`;
        } else {
          timeDisplay = `${displayStart.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })} - ${displayEnd.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
        }

        return {
          ...event,
          top,
          height,
          continuesBefore,
          continuesAfter,
          timeDisplay
        };
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const scrollToWorkHours = () => {
  nextTick(() => {
    if (scrollContainer.value && workStartRef.value) {
      const container = scrollContainer.value;
      const target = workStartRef.value;
      container.scrollTop = target.offsetTop - 20;
    }
  });
};

const previousWeek = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 7));
  scrollToWorkHours();
};

const nextWeek = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 7));
  scrollToWorkHours();
};

onMounted(() => {
  scrollToWorkHours();
});

defineExpose({
  goToDate: (date) => {
    currentDate.value = new Date(date);
    scrollToWorkHours();
  }
});
</script>