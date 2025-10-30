<template>
  <div class="flex flex-col md:flex-row max-md:gap-3 items-center justify-between mb-5">
    <div class="flex items-center gap-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
            d="M17 4.5L17 5.15L17 4.5ZM7 4.5L7 3.85L7 4.5ZM8.05 14.65C8.41 14.65 8.7 14.36 8.7 14C8.7 13.64 8.41 13.35 8.05 13.35V14.65ZM8 13.35C7.64 13.35 7.35 13.64 7.35 14C7.35 14.36 7.64 14.65 8 14.65V13.35ZM8.05 17.65C8.41 17.65 8.7 17.36 8.7 17C8.7 16.64 8.41 16.35 8.05 16.35V17.65ZM8 16.35C7.64 16.35 7.35 16.64 7.35 17C7.35 17.36 7.64 17.65 8 17.65V16.35ZM12.05 14.65C12.41 14.65 12.7 14.36 12.7 14C12.7 13.64 12.41 13.35 12.05 13.35V14.65ZM12 13.35C11.64 13.35 11.35 13.64 11.35 14C11.35 14.36 11.64 14.65 12 14.65V13.35ZM12.05 17.65C12.41 17.65 12.7 17.36 12.7 17C12.7 16.64 12.41 16.35 12.05 16.35V17.65ZM12 16.35C11.64 16.35 11.35 16.64 11.35 17C11.35 17.36 11.64 17.65 12 17.65V16.35ZM16.05 14.65C16.41 14.65 16.7 14.36 16.7 14C16.7 13.64 16.41 13.35 16.05 13.35V14.65ZM16 13.35C15.64 13.35 15.35 13.64 15.35 14C15.35 14.36 15.64 14.65 16 14.65V13.35ZM16.05 17.65C16.41 17.65 16.7 17.36 16.7 17C16.7 16.64 16.41 16.35 16.05 16.35V17.65ZM16 16.35C15.64 16.35 15.35 16.64 15.35 17C15.35 17.36 15.64 17.65 16 17.65V16.35ZM8.65 3C8.65 2.64 8.36 2.35 8 2.35C7.64 2.35 7.35 2.64 7.35 3H8.65ZM7.35 6C7.35 6.36 7.64 6.65 8 6.65C8.36 6.65 8.65 6.36 8.65 6H7.35ZM16.65 3C16.65 2.64 16.36 2.35 16 2.35C15.64 2.35 15.35 2.64 15.35 3H16.65ZM15.35 6C15.35 6.36 15.64 6.65 16 6.65C16.36 6.65 16.65 6.36 16.65 6H15.35ZM7 5.15H17V3.85H7V5.15ZM20.35 8.5V17H21.65V8.5H20.35ZM17 20.35H7V21.65H17V20.35ZM3.65 17V8.5H2.35V17H3.65ZM7 20.35C6.04 20.35 5.38 20.35 4.89 20.28C4.42 20.22 4.2 20.11 4.05 19.95L3.13 20.87C3.56 21.31 4.1 21.49 4.72 21.57C5.32 21.65 6.08 21.65 7 21.65V20.35ZM2.35 17C2.35 17.92 2.35 18.68 2.43 19.28C2.51 19.9 2.69 20.44 3.13 20.87L4.05 19.95C3.89 19.8 3.78 19.58 3.72 19.11C3.65 18.62 3.65 17.96 3.65 17H2.35ZM20.35 17C20.35 17.96 20.35 18.62 20.28 19.11C20.22 19.58 20.11 19.8 19.95 19.95L20.87 20.87C21.31 20.44 21.49 19.9 21.57 19.28C21.65 18.68 21.65 17.92 21.65 17H20.35ZM17 21.65C17.92 21.65 18.68 21.65 19.28 21.57C19.9 21.49 20.44 21.31 20.87 20.87L19.95 19.95C19.8 20.11 19.58 20.22 19.11 20.28C18.62 20.35 17.96 20.35 17 20.35V21.65ZM17 5.15C17.96 5.15 18.62 5.15 19.11 5.22C19.58 5.28 19.8 5.39 19.95 5.55L20.87 4.63C20.44 4.19 19.9 4.01 19.28 3.93C18.68 3.85 17.92 3.85 17 3.85V5.15ZM21.65 8.5C21.65 7.58 21.65 6.82 21.57 6.22C21.49 5.6 21.31 5.06 20.87 4.63L19.95 5.55C20.11 5.7 20.22 5.92 20.28 6.39C20.35 6.88 20.35 7.54 20.35 8.5H21.65ZM7 3.85C6.08 3.85 5.32 3.85 4.72 3.93C4.1 4.01 3.56 4.19 3.13 4.63L4.05 5.55C4.2 5.39 4.42 5.28 4.89 5.22C5.38 5.15 6.04 5.15 7 5.15V3.85ZM3.65 8.5C3.65 7.54 3.65 6.88 3.72 6.39C3.78 5.92 3.89 5.7 4.05 5.55L3.13 4.63C2.69 5.06 2.51 5.6 2.43 6.22C2.35 6.82 2.35 7.58 2.35 8.5H3.65ZM3 10.65H21V9.35H3V10.65ZM7.35 3V6H8.65V3H7.35ZM15.35 3V6H16.65V3H15.35Z"
            fill="#111827"/>
      </svg>
      <button
          @click="$emit('goToToday')"
          class="text-xl leading-8 font-semibold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        {{ currentDateLabel }}
      </button>
    </div>

    <div class="flex items-center gap-px rounded-lg bg-gray-100 p-1">
      <CalendarButton
          label="Jour"
          :is-active="currentView === 'day'"
          @click="$emit('changeView', 'day')"
      />
      <CalendarButton
          label="Semaine"
          :is-active="currentView === 'week'"
          @click="$emit('changeView', 'week')"
      />
      <CalendarButton
          label="Mois"
          :is-active="currentView === 'month'"
          @click="$emit('changeView', 'month')"
      />
    </div>

    <button
        class="py-2.5 pr-7 pl-5 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
        @click="$emit('newEvent')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 5V15M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      Nouveau rendez-vous
    </button>
  </div>
</template>

<script setup>
import CalendarButton from '../common/CalendarButton.vue';

defineProps({
  currentDateLabel: {
    type: String,
    required: true
  },
  currentView: {
    type: String,
    required: true
  }
});

defineEmits(['changeView', 'newEvent', 'goToToday']);
</script>