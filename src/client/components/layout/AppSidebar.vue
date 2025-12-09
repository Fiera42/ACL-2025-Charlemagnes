<template>
  <!-- Overlay -->
  <div
      v-if="isOpen"
      class="fixed inset-0 bg-opacity-50 z-40 pointer-events-none"
  ></div>

  <!-- Sidebar -->
  <aside
      :class="[
                            'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out w-80 flex flex-col',
                            isOpen ? 'translate-x-0' : '-translate-x-full'
                          ]"
      :style="{ overflow: 'hidden' }"
  >
    <div class="flex flex-col h-full">
      <!-- Header du sidebar -->
      <div class="flex-shrink-0 px-3 pt-3 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div class="relative">
          <div class="grid grid-cols-3 text-sm font-semibold text-center">
            <button
                :class="isAppointmentsView ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
                class="py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap leading-snug"
                @click="selectTab('appointments','toggleappointmentsdisplay')"
            >
              Rendez-vous
            </button>
            <button
                :class="isCalendarsView ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
                class="py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap leading-snug"
                @click="selectTab('calendars','togglecalendarsdisplay')"
            >
              Calendriers
            </button>
            <button
                :class="isTagsView ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
                class="py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap leading-snug"
                @click="selectTab('tags','toggletagsdisplay')"
            >
              Tags
            </button>
          </div>
          <span
              class="absolute bottom-0 left-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-300 ease-out"
              :style="{ width: indicatorWidth, transform: indicatorTransform }"
          ></span>
        </div>
      </div>
      <!-- Contenu scrollable -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Liste des rendez-vous -->
        <div v-if="isAppointmentsView">

          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Rendez-vous à venir</h2>
            <button
                @click="$emit('close')"
                class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="loading" class="text-center text-gray-500 py-8">
              Chargement...
            </div>
            <div v-else-if="upcomingAppointments.length === 0" class="text-center text-gray-500 py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                   class="mx-auto mb-3 text-gray-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <p class="text-sm">Aucun rendez-vous à venir</p>
            </div>
            <div v-else class="space-y-3">
              <div
                  v-for="appointment in upcomingAppointments"
                  :key="appointment.id"
                  class="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer relative"
                  @click="$emit('selectAppointment', appointment)"
              >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-medium text-gray-900 text-sm truncate flex-1">{{ appointment.title }}</h3>
                  <span class="text-xs font-semibold text-indigo-600 ml-2">{{ appointment.hour }}</span>
                </div>
                <p v-if="appointment.description" class="text-xs text-gray-600 mb-2 line-clamp-2">
                  {{ appointment.description }}
                </p>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{{ appointment.dateLabel }}</span>
                </div>
                <div v-if="appointment.recursionRule !== undefined && appointment.recursionRule !== null"
                     class="absolute bottom-1 right-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="isCalendarsView">

          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Liste des calendriers</h2>
            <button
                @click="$emit('close')"
                class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <div class="flex justify-center mb-6">
              <button
                  class="py-2.5 px-6 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
                  @click="$emit('CalendarForm')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 5V15M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                Nouveau
              </button>

              <button
                  class="py-2.5 px-6 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
                  @click="$emit('ImportCalendar')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 5V15M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                Importer
              </button>
            </div>

            <div v-if="loadingCalendars" class="text-center text-gray-500 py-8">
              Chargement...
            </div>

            <div v-else-if="calendars.length === 0" class="text-center text-gray-500 py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                   class="mx-auto mb-3 text-gray-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <p class="text-sm">Aucun calendrier</p>
            </div>

            <div v-else class="space-y-3">
              <div
                  v-for="calendar in props.calendars"
                  :key="calendar.id"
                  class="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                  @click="$emit('selectCalendar', calendar)"
              >
                <div class="flex items-center justify-between gap-3 mb-2">
                  <label class="flex items-center gap-2 min-w-0 cursor-pointer" @click.stop>
                    <input
                        type="checkbox"
                        class="w-4 h-4 rounded border-gray-300"
                        :style="{ accentColor: calendar.color }"
                        :checked="calendarService.visibleCalendars.has(calendar.id)"
                        @change="$emit('calendarToggled', calendar.id, $event.target.checked)"
                    />
                    <span class="text-sm font-medium text-gray-900 truncate" :title="calendar.name">
                                          {{ calendar.name }}
                                        </span>
                  </label>

                  <div class="flex-shrink-0">
                    <button
                        :ref="el => setDropdownButtonRef(calendar.id, el)"
                        title="Options"
                        class="p-2 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 transition-all duration-300 hover:bg-gray-200"
                        @click.stop="toggleDropdown(calendar.id, $event)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </button>
                  </div>
                </div>

                <p v-if="calendar.description" class="text-xs text-gray-600 mb-2 line-clamp-2">
                  {{ calendar.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="isTagsView">
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Liste des tags</h2>
            <button
                @click="$emit('close')"
                class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            <div class="flex justify-center mb-6">
              <button
                  class="py-2.5 px-6 bg-indigo-600 rounded-xl flex items-center gap-2 text-base font-semibold text-white transition-all duration-300 hover:bg-indigo-700"
                  @click="handleNewTagClick"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 5V15M15 10H5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                Nouveau tag
              </button>
            </div>

            <div v-if="loadingTags" class="text-center text-gray-500 py-8">
              Chargement...
            </div>

            <div v-else-if="tags.length === 0" class="text-center text-gray-500 py-8">
              <p class="text-sm">Aucun tag</p>
            </div>

            <div v-else class="space-y-3">
              <div
                  v-for="tag in tags"
                  :key="tag.id"
                  class="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                                        <span
                                            :style="{ backgroundColor: tag.color }"
                                            class="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                        ></span>
                    <h3 class="font-medium text-gray-900 text-sm truncate" :title="tag.name">{{ tag.name }}</h3>
                  </div>
                  <div class="flex items-center justify-end gap-1.5 flex-shrink-0">
                    <button
                        class="p-2 bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:bg-indigo-700"
                        @click="handleEditTagClick(tag)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-white">
                        <path
                            d="M22,7.24a1,1,0,0,0-.29-.71L17.47,2.29A1,1,0,0,0,16.76,2a1,1,0,0,0-.71.29L13.22,5.12h0L2.29,16.05a1,1,0,0,0-.29.71V21a1,1,0,0,0,1,1H7.24A1,1,0,0,0,8,21.71L18.87,10.78h0L21.71,8a1.19,1.19,0,0,0,.22-.33,1,1,0,0,0,0-.24.7.7,0,0,0,0-.14ZM6.83,20H4V17.17l9.93-9.93,2.83,2.83ZM18.17,8.66,15.34,5.83l1.42-1.41,2.82,2.82Z"/>
                      </svg>
                      <span class="sr-only">Modifier</span>
                    </button>
                    <button
                        class="p-2 bg-red-500 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:bg-red-600"
                        @click="$emit('deleteTag', tag.id)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-white">
                        <path
                            d="M20,6H16V5a3,3,0,0,0-3-3H11A3,3,0,0,0,8,5V6H4A1,1,0,0,0,4,8H5V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V8h1a1,1,0,0,0,0-2ZM10,5a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1V6H10Zm7,14a1,1,0,0,1-1,1H8a1,1,0,0,1-1-1V8H17Z"/>
                      </svg>
                      <span class="sr-only">Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </aside>

  <!-- Dropdown Menu (Teleported outside sidebar) -->
  <Teleport to="body">
    <div
        v-if="openDropdownId !== null"
        class="fixed w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
        :style="dropdownStyle"
        @click.stop
    >
      <button
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          @click="handleEdit(getCalendarById(openDropdownId))"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-gray-600">
          <path
              d="M22,7.24a1,1,0,0,0-.29-.71L17.47,2.29A1,1,0,0,0,16.76,2a1,1,0,0,0-.71.29L13.22,5.12h0L2.29,16.05a1,1,0,0,0-.29.71V21a1,1,0,0,0,1,1H7.24A1,1,0,0,0,8,21.71L18.87,10.78h0L21.71,8a1.19,1.19,0,0,0,.22-.33,1,1,0,0,0,0-.24.7.7,0,0,0,0-.14ZM6.83,20H4V17.17l9.93-9.93,2.83,2.83ZM18.17,8.66,15.34,5.83l1.42-1.41,2.82,2.82Z"/>
        </svg>
        Modifier
      </button>
      <button
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          @click="handleExport(getCalendarById(openDropdownId))"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-gray-600">
          <path
              d="M21,14a1,1,0,0,0-1,1v4a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V15a1,1,0,0,0-2,0v4a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V15A1,1,0,0,0,21,14Zm-9.71,1.71a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l4-4a1,1,0,0,0-1.42-1.42L13,12.59V3a1,1,0,0,0-2,0v9.59l-2.29-2.3a1,1,0,1,0-1.42,1.42Z"/>
        </svg>
        Exporter .ics
      </button>
      <hr class="my-1 border-gray-200"/>
      <button
          class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          @click="handleDelete(openDropdownId)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 fill-red-600">
          <path
              d="M20,6H16V5a3,3,0,0,0-3-3H11A3,3,0,0,0,8,5V6H4A1,1,0,0,0,4,8H5V19a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V8h1a1,1,0,0,0,0-2ZM10,5a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1V6H10Zm7,14a1,1,0,0,1-1,1H8a1,1,0,0,1-1-1V8H17Z"/>
        </svg>
        Supprimer
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {computed, ref, watch, onMounted, onBeforeUnmount} from 'vue';
import {calendarService} from "../../assets/calendar.js";

const emit = defineEmits([
  'close',
  'selectAppointment',
  'toggleappointmentsdisplay',
  'togglecalendarsdisplay',
  'toggletagsdisplay',
  'CalendarForm',
  'TagForm',
  'editCalendar',
  'deleteCalendar',
  'editTag',
  'deleteTag',
  'exportCalendar',
  'ImportCalendar',
  'calendarToggled'
]);

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  appointmentsdisplayed: {
    type: Boolean,
    default: false
  },
  calendarsdisplayed: {
    type: Boolean,
    default: false
  },
  tagsdisplayed: {
    type: Boolean,
    default: false
  },
  appointments: {
    type: Array,
    default: () => []
  },
  calendars: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingCalendars: {
    type: Boolean,
    default: false
  },
  loadingTags: {
    type: Boolean,
    default: false
  }
});

const openDropdownId = ref<string | null>(null);
const dropdownPosition = ref({top: 0, left: 0});
const dropdownButtonRefs = ref<Record<string, HTMLElement | null>>({});

const setDropdownButtonRef = (calendarId: string, el: HTMLElement | null) => {
  dropdownButtonRefs.value[calendarId] = el;
};

const dropdownStyle = computed(() => ({
  top: `${dropdownPosition.value.top}px`,
  left: `${dropdownPosition.value.left}px`
}));

const getCalendarById = (id: string | null) => {
  if (!id) return null;
  return props.calendars.find((c: any) => c.id === id) || null;
};

const toggleDropdown = (calendarId: string, event: MouseEvent) => {
  if (openDropdownId.value === calendarId) {
    openDropdownId.value = null;
  } else {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    // Positionner le dropdown en dessous du bouton, aligné à droite
    dropdownPosition.value = {
      top: rect.bottom + 4,
      left: rect.right - 160 // 160px = largeur du dropdown (w-40)
    };

    openDropdownId.value = calendarId;
  }
};

const closeDropdown = () => {
  openDropdownId.value = null;
};

const handleEdit = (calendar: any) => {
  if (!calendar) return;
  emit('editCalendar', calendar.id, calendar.name, calendar.description, calendar.color);
  closeDropdown();
};

const handleExport = (calendar: any) => {
  if (!calendar) return;
  emit('exportCalendar', calendar, props.appointments);
  closeDropdown();
};

const handleDelete = (calendarId: string) => {
  emit('deleteCalendar', calendarId);
  closeDropdown();
};

const handleClickOutside = (event: MouseEvent) => {
  if (openDropdownId.value !== null) {
    const target = event.target as HTMLElement;
    // Vérifier si le clic est en dehors du dropdown et du bouton
    if (!target.closest('.fixed.w-40') && !target.closest('button[title="Options"]')) {
      closeDropdown();
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const upcomingAppointments = computed(() => {
  const now = new Date();
  const limitDate = new Date();
  limitDate.setMonth(limitDate.getMonth() + 1);

  const result = [];

  props.appointments.forEach(appt => {
    const start = new Date(appt.startDate);
    const end = new Date(appt.endDate);
    const duration = end - start;
    const rule = appt.recursionRule;

    // Pas de récurrence
    if (rule === undefined || rule === null) {
      if (start > now && start <= limitDate) result.push(appt);
      return;
    }

    // Si il y a une récurrence on prend la valeur la plus petite parmis la limitDate ou la date de fin de récurrence
    let recurrenceEnd = appt.recursionEndDate ? new Date(appt.recursionEndDate) : limitDate;
    recurrenceEnd = recurrenceEnd < limitDate ? recurrenceEnd : limitDate;

    // Calculer la première occurrence après maintenant
    let cursor = new Date(start);

    switch (rule) {
      case 0: // quotidien
        while (cursor < now) cursor.setDate(cursor.getDate() + 1);
        break;
      case 1: // hebdomadaire
        while (cursor < now) cursor.setDate(cursor.getDate() + 7);
        break;
      case 2: // mensuel
        while (cursor < now) cursor.setMonth(cursor.getMonth() + 1);
        break;
      case 3: // annuel
        while (cursor < now) cursor.setFullYear(cursor.getFullYear() + 1);
        break;
    }

    // Ajouter toutes les occurrences jusqu'à la limite
    while (cursor <= recurrenceEnd) {
      result.push({
        ...appt,
        startDate: new Date(cursor),
        endDate: new Date(cursor.getTime() + duration),
        isOccurrence: true
      });

      switch (rule) {
        case 0:
          cursor.setDate(cursor.getDate() + 1);
          break;
        case 1:
          cursor.setDate(cursor.getDate() + 7);
          break;
        case 2:
          cursor.setMonth(cursor.getMonth() + 1);
          break;
        case 3:
          cursor.setFullYear(cursor.getFullYear() + 1);
          break;
      }
    }
  });

  return result
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .map(appt => ({
        ...appt,
        dateLabel: new Date(appt.startDate).toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }),
        hour: new Date(appt.startDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
      }));
});

const tabOrder = ['appointments', 'calendars', 'tags'] as const;
const forcedView = computed(() => {
  if (props.tagsdisplayed) return 'tags';
  if (props.calendarsdisplayed) return 'calendars';
  if (props.appointmentsdisplayed) return 'appointments';
  return null;
});
const internalView = ref<typeof tabOrder[number]>('appointments');
watch(forcedView, (val) => {
  if (val) internalView.value = val;
}, {immediate: true});

const isAppointmentsView = computed(() => internalView.value === 'appointments');
const isCalendarsView = computed(() => internalView.value === 'calendars');
const isTagsView = computed(() => internalView.value === 'tags');

const activeTabIndex = computed(() => tabOrder.indexOf(internalView.value));
const indicatorWidth = computed(() => `${100 / tabOrder.length}%`);
const indicatorTransform = computed(() => `translateX(${activeTabIndex.value * 100}%)`);

const selectTab = (view: typeof tabOrder[number], emitName: string) => {
  internalView.value = view;
  emit(emitName);
};

const dispatchTagFormEvent = (payload: any = null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-tag-form', {detail: payload}));
  }
};

const handleNewTagClick = () => {
  dispatchTagFormEvent(null);
  emit('TagForm');
};

const handleEditTagClick = (tag: any) => {
  dispatchTagFormEvent(tag);
  emit('editTag', tag);
};

const getTagById = (id: string) => props.tags.find((t: any) => t.id === id);
const getTagColor = (id: string) => getTagById(id)?.color || '#ccc';
const getTagName = (id: string) => getTagById(id)?.name || 'Inconnu';
</script>