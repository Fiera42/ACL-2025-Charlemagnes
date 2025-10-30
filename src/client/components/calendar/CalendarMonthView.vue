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
          class="bg-gray-50 p-3.5 text-center text-sm font-medium text-gray-700"
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
          :key="day.date"
          :class="[
            'bg-white p-2 min-h-[100px] cursor-pointer transition-all hover:bg-stone-100',
            !day.isCurrentMonth && 'opacity-40'
          ]"
          @click="$emit('newEvent', day.date)"
      >
        <div class="font-medium text-sm mb-1"
             :class="isToday(day.date) ? 'text-indigo-600 font-bold' : 'text-gray-900'">
          {{ day.dayNumber }}
        </div>

        <div class="space-y-1">
          <CalendarEvent
              v-for="event in getDayEvents(day.date)"
              :key="event.id"
              :title="event.title"
              :time="event.hour"
              :color-class="event.colorClass"
              :text-color="event.textColor"
              @click.stop="$emit('editEvent', event)"
          />
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
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      dayNumber: prevMonthLastDay - i,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      date: new Date(year, month, i),
      dayNumber: i,
      isCurrentMonth: true
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      dayNumber: i,
      isCurrentMonth: false
    });
  }

  return days;
});

const getDayEvents = (date) => {
  return props.events.filter(event => {
    const eventDate = new Date(event.startDate);
    return eventDate.toDateString() === date.toDateString();
  });
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

</script>