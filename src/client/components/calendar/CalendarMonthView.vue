<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="previousMonth"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        ← Précédent
      </button>
      <h2 class="text-xl font-semibold">
        {{ currentMonthName }} {{ currentYear }}
      </h2>
      <button @click="nextMonth"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
        Suivant →
      </button>
    </div>

    <div class="grid grid-cols-7 gap-px bg-gray-200">
      <div
          v-for="day in daysOfWeek"
          :key="day"
          class="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-900"
      >
        {{ day }}
      </div>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-500">
      Chargement...
    </div>
    <div v-else class="grid grid-cols-7 gap-px bg-gray-200">
      <div
          v-for="day in calendarDays"
          :key="`${day.date.getMonth()}-${day.day}`"
          :class="[
                  'bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50',
                  !day.isCurrentMonth && 'bg-gray-50'
                ]"
          @click="$emit('newEvent', day.date)"
      >
        <div class="flex items-center justify-between mb-2">
                <span
                    :class="[
                      'text-sm font-semibold',
                      !day.isCurrentMonth ? 'text-gray-400' : isToday(day.date) ? 'text-indigo-600' : 'text-gray-900'
                    ]"
                >
                  {{ day.day }}
                </span>
        </div>
        <div class="space-y-1">
          <div
              v-for="event in getDayEvents(day.date).slice(0, 3)"
              :key="event.id"
              :class="[
                      'rounded p-1.5 border-l-2 cursor-pointer'
                    ]"
              :style="{
                  borderColor: event.color,
                  backgroundColor: addAlpha(event.color, 0.3),
                }"
              @click.stop="$emit('showEvent', event)" class="relative"
          >
            <p class="text-xs font-semibold text-gray-900 truncate">{{ event.title }}</p>
            <p :class="['text-xs font-semibold']">{{ event.timeDisplay }}</p>
            <div v-if="event.recursionRule !== undefined && event.recursionRule !== null" class="absolute bottom-1 right-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
            </div>
          </div>
          <button
              v-if="getDayEvents(day.date).length > 3"
              class="text-xs text-gray-600 hover:text-indigo-600 font-medium"
              @click.stop="showMoreEvents(day.date)"
          >
            + {{ getDayEvents(day.date).length - 3 }} autres
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue';

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

const emit = defineEmits(['newEvent', 'showEvent']);

const currentDate = ref(new Date());

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', {month: 'long'});
});

const currentYear = computed(() => {
  return currentDate.value.getFullYear();
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({date, day: prevMonthLastDay - i, isCurrentMonth: false});
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({date, day: i, isCurrentMonth: true});
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({date, day: i, isCurrentMonth: false});
  }

  return days;
});

const getDayEvents = (date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return expandedEvents.value
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
          timeDisplay
        };
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
};
const expandedEvents = computed(() => {
  const result = [];

  const viewStart = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
  const viewEnd = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0);
  viewStart.setHours(0, 0, 0, 0);
  viewEnd.setHours(23, 59, 59, 999);

  props.events.forEach(event => {
    // !!! Recursion rule peut être 0
    if (!event.recursionRule && event.recursionRule !== 0) {
      // Vérifie si l'événement tombe dans le mois
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      if (eventEnd >= viewStart && eventStart <= viewEnd) {
        result.push(event);
      }
      return;
    }

    const rule = event.recursionRule;
    const duration = new Date(event.endDate) - new Date(event.startDate);

    let cursor = new Date(event.startDate);

    // Ajuster pour commencer au mois courant
    if (cursor < viewStart) {
      switch(rule) {
        case 0:
          cursor = new Date(viewStart);
          break;
        case 1: {
          const dayDiff = Math.floor((viewStart - cursor)/(1000*60*60*24));
          const weeksToAdd = Math.floor(dayDiff/7);
          cursor.setDate(cursor.getDate() + weeksToAdd*7);
          if (cursor < viewStart) cursor.setDate(cursor.getDate() + 7);
          break;
        }
        case 2:
          cursor = new Date(cursor);
          cursor.setFullYear(viewStart.getFullYear(), viewStart.getMonth(), cursor.getDate());
          if (cursor < viewStart) cursor.setMonth(cursor.getMonth() + 1);
          break;
        case 3:
          cursor = new Date(cursor);
          cursor.setFullYear(viewStart.getFullYear());
          if (cursor < viewStart) cursor.setFullYear(cursor.getFullYear() + 1);
          break;
      }
    }

    let recurrenceEnd = event.recursionEndDate ? new Date(event.recursionEndDate) : viewEnd;
    recurrenceEnd = recurrenceEnd < viewEnd ? recurrenceEnd : viewEnd;

    while (cursor < recurrenceEnd) {
      const newStart = new Date(cursor);
      newStart.setHours(
        new Date(event.startDate).getHours(),
        new Date(event.startDate).getMinutes(),
        new Date(event.startDate).getSeconds(),
      );

      const newEnd = new Date(newStart.getTime() + duration);

      // Si la fin de récurrence est définie et que le nouvel événement la dépasse, on arrête
      if (newEnd > recurrenceEnd) break;

      result.push({
        ...event,
        startDate: newStart,
        endDate: newEnd,
        isOccurrence: true
      });

      switch(rule) {
        case 0: cursor.setDate(cursor.getDate() + 1); break;
        case 1: cursor.setDate(cursor.getDate() + 7); break;
        case 2: cursor.setMonth(cursor.getMonth() + 1); break;
        case 3: cursor.setFullYear(cursor.getFullYear() + 1); break;
        default: break;
      }
    }
  });
  return result;
});

const showMoreEvents = (date) => {
  emit('newEvent', date);
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1);
};

defineExpose({
  goToDate: (date) => {
    currentDate.value = new Date(date);
  }
});

function addAlpha(color, opacity) {
  const _opacity = Math.round(Math.min(Math.max(opacity ?? 1, 0), 1) * 255);
  return color + _opacity.toString(16).toUpperCase();
}
</script>