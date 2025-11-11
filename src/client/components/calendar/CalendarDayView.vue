<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="previousDay"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        ← Précédent
      </button>
      <h2 class="text-xl font-semibold">
        {{ dayLabel }}
      </h2>
      <button @click="nextDay"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        Suivant →
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500">
      Chargement...
    </div>
    <div v-else ref="scrollContainer" class="relative overflow-y-auto max-h-[calc(100vh-250px)]">
      <div class="grid grid-cols-1 relative">
        <div
            v-for="hour in hours"
            :key="hour"
            :ref="hour === '07:00' ? 'workStartRef' : undefined"
            class="flex border-t border-gray-200"
        >
          <div class="w-20 p-3.5 flex items-start text-xs font-semibold text-gray-400">
            {{ hour }}
          </div>
          <div
              class="flex-1 p-3.5 transition-all hover:bg-stone-100 cursor-pointer min-h-[80px] relative"
              @click="$emit('newEvent', currentDate, hour)"
          >
          </div>
        </div>

        <!-- Événements positionnés en absolu -->
        <div class="absolute top-0 left-20 right-0 pointer-events-none">
          <div
              v-for="event in positionedEvents"
              :key="event.id"
              :style="{
                      top: event.top + 'px',
                      height: event.height + 'px',
                      left: (event.column * 100 / event.totalColumns) + '%',
                      width: (100 / event.totalColumns) + '%'
                    }"
              class="absolute px-1 pointer-events-auto"
          >
            <div
                :class="[
                        'rounded p-2 border-l-4 cursor-pointer h-full overflow-hidden'
                      ]"
                :style="{
                  borderColor: event.color,
                  backgroundColor: addAlpha(event.color, 0.3),
                }"
                @click.stop="$emit('showEvent', event)"
            >
              <div class="flex items-start justify-between gap-1">
                <p class="text-xs font-medium text-gray-900 truncate flex-1">{{ event.title }}</p>
                <span
                    v-if="event.continuesBefore"
                    class="text-xs text-gray-600"
                    title="Continue depuis le jour précédent"
                >↑</span>
              </div>
              <p :class="['text-xs font-semibold mt-1']">{{ event.timeDisplay }}</p>
              <span
                  v-if="event.continuesAfter"
                  class="text-xs text-gray-600 block mt-1"
                  title="Continue le jour suivant"
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

const dayLabel = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
});

const positionedEvents = computed(() => {
  const dayStart = new Date(currentDate.value);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDate.value);
  dayEnd.setHours(23, 59, 59, 999);

  const dayEvents = props.events
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
          displayStart,
          displayEnd,
          top,
          height,
          continuesBefore,
          continuesAfter,
          timeDisplay
        };
      })
      .sort((a, b) => a.displayStart - b.displayStart);

  const columns = [];
  dayEvents.forEach(event => {
    let placed = false;

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const hasOverlap = column.some(e => {
        return event.displayStart < e.displayEnd && event.displayEnd > e.displayStart;
      });

      if (!hasOverlap) {
        column.push(event);
        event.column = i;
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([event]);
      event.column = columns.length - 1;
    }
  });

  dayEvents.forEach(event => {
    event.totalColumns = columns.length;
  });

  return dayEvents;
});

const scrollToWorkHours = () => {
  nextTick(() => {
    if (scrollContainer.value && workStartRef.value) {
      const container = scrollContainer.value;
      const target = workStartRef.value;
      container.scrollTop = target.offsetTop - 20;
    }
  });
};

const scrollToAppointmentTime = (appointmentDate) => {
  nextTick(() => {
    if (!scrollContainer.value) return;
    const container = scrollContainer.value;

    // récupère l'heure de l'appointment
    const hour = appointmentDate.getHours();
    const minute = appointmentDate.getMinutes();

    // une heure = 80px de hauteur
    const hourHeight = 80;

    // On calcule la hauteur du rdv
    const scrollPosition = hour * hourHeight + (minute / 60) * hourHeight;

    container.scrollTop = scrollPosition - 40; // petit offset visuel
  });
};


const previousDay = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 1));
  scrollToWorkHours();
};

const nextDay = () => {
  currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 1));
  scrollToWorkHours();
};

onMounted(() => {
  scrollToWorkHours();
});

defineExpose({
  goToDate: (date) => {
    currentDate.value = new Date(date);
    scrollToWorkHours();
  },
  scrollToAppointmentTime
});

function addAlpha(color, opacity) {
  const _opacity = Math.round(Math.min(Math.max(opacity ?? 1, 0), 1) * 255);
  return color + _opacity.toString(16).toUpperCase();
}
</script>