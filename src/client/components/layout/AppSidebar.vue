<script setup lang="ts">
  import {computed, ref, watch, onMounted, onBeforeUnmount} from 'vue';
  import {calendarService} from "../../assets/calendar.js";
  import CalendarShareModal from "../calendar/CalendarShareModal.vue";
  import axios from 'axios';

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
    'importCalendar',
    'calendarToggled',
    'removeSharedCalendar'
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
    sharedCalendars: {
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
  const isSharedDropdown = ref(false);

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

  const getSharedCalendarById = (id: string | null) => {
    if (!id) return null;
    return props.sharedCalendars.find((c: any) => c.id === id) || null;
  };

  const toggleDropdown = (calendarId: string, event: MouseEvent, isShared: boolean = false) => {
    if (openDropdownId.value === calendarId) {
      openDropdownId.value = null;
      isSharedDropdown.value = false;
    } else {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();

      dropdownPosition.value = {
        top: rect.bottom + 4,
        left: rect.right - 160
      };

      openDropdownId.value = calendarId;
      isSharedDropdown.value = isShared;
    }
  };

  const closeDropdown = () => {
    openDropdownId.value = null;
    isSharedDropdown.value = false;
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

  const handleRemoveSharedCalendar = async (calendarId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token non trouvé');
        return;
      }

      const calendar = props.sharedCalendars.find((c: any) => c.id === calendarId);
      if (calendar) {
        await axios.delete(`/api/share/leave/${calendarId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        emit('removeSharedCalendar', calendarId);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du partage:', error);
    }
    closeDropdown();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (openDropdownId.value !== null) {
      const target = event.target as HTMLElement;
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

    const result: any[] = [];

    props.appointments.forEach((appt: any) => {
      const start = new Date(appt.startDate);
      const end = new Date(appt.endDate);
      const duration = end.getTime() - start.getTime();
      const rule = appt.recursionRule;

      if (rule === undefined || rule === null) {
        if (start > now && start <= limitDate) result.push(appt);
        return;
      }

      let recurrenceEnd = appt.recursionEndDate ? new Date(appt.recursionEndDate) : limitDate;
      recurrenceEnd = recurrenceEnd < limitDate ? recurrenceEnd : limitDate;

      let cursor = new Date(start);

      switch (rule) {
        case 0:
          while (cursor < now) cursor.setDate(cursor.getDate() + 1);
          break;
        case 1:
          while (cursor < now) cursor.setDate(cursor.getDate() + 7);
          break;
        case 2:
          while (cursor < now) cursor.setMonth(cursor.getMonth() + 1);
          break;
        case 3:
          while (cursor < now) cursor.setFullYear(cursor.getFullYear() + 1);
          break;
      }

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
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
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

  const handleRemoveAccess = async (calendarId: string, userId: string) => {
    try {
      await axios.delete(`/api/share/calendar/${calendarId}/user/${userId}`);
      // Optionnel : rafraîchir la liste des partages
      emit('calendarsUpdated');
    } catch (error) {
      console.error('Erreur lors de la suppression du partage:', error);
    }
  };

  const getTagById = (id: string) => props.tags.find((t: any) => t.id === id);
  const getTagColor = (id: string) => getTagById(id)?.color || '#ccc';
  const getTagName = (id: string) => getTagById(id)?.name || 'Inconnu';

  const shareModalCalendar = ref<any | null>(null);
  const isShareModalOpen = computed(() => shareModalCalendar.value !== null);

  const handleShare = (calendar: any) => {
    if (!calendar) return;
    shareModalCalendar.value = calendar;
    closeDropdown();
  };

  const closeShareModal = () => {
    shareModalCalendar.value = null;
  };
  </script>

  <template>
    <!-- Overlay -->
    <div
        v-if="isOpen"
        class="fixed inset-0 bg-opacity-50 z-40 pointer-events-none"
    ></div>

    <!-- Sidebar -->
    <aside
        :class="[
          'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out w-80 flex flex-col shadow-lg',
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
        <div class="flex-1 overflow-y-auto">
          <!-- Liste des rendez-vous -->
          <div v-if="isAppointmentsView" class="h-full flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 class="text-lg font-semibold text-gray-900">Rendez-vous à venir</h2>
              <button
                  @click="$emit('close')"
                  class="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
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
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-2">Chargement...</p>
              </div>
              <div v-else-if="upcomingAppointments.length === 0" class="text-center text-gray-500 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                     class="mx-auto mb-3 text-gray-300">
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
                    :key="appointment.id + '-' + appointment.startDate"
                    class="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                    @click="$emit('selectAppointment', appointment)"
                >
                  <div class="flex items-start gap-3">
                    <div
                        class="w-1 h-12 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: calendars.find((c: any) => c.id === appointment.calendarId)?.color || '#6366f1' }"
                    ></div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {{ appointment.title }}
                      </h3>
                      <p class="text-sm text-gray-500 mt-1">
                        {{ appointment.dateLabel }} · {{ appointment.hour }}
                      </p>
                      <p v-if="appointment.location" class="text-xs text-gray-400 mt-1 truncate">
                        📍 {{ appointment.location }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste des calendriers -->
          <div v-else-if="isCalendarsView" class="h-full flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 class="text-lg font-semibold text-gray-900">Mes calendriers</h2>
              <button
                  @click="$emit('close')"
                  class="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4">
              <!-- Boutons d'action -->
              <div class="flex justify-center gap-2 mb-6">
                <button
                    @click="$emit('CalendarForm')"
                    class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Nouveau
                </button>
                <button
                    @click="$emit('importCalendar')"
                    class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Importer
                </button>
              </div>

              <div v-if="loadingCalendars" class="text-center text-gray-500 py-8">
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-2">Chargement...</p>
              </div>

              <div v-else-if="calendars.length === 0" class="text-center text-gray-500 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                     class="mx-auto mb-3 text-gray-300">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p class="text-sm">Aucun calendrier</p>
              </div>

              <!-- Liste des calendriers personnels -->
              <div v-else class="space-y-2">
                <div
                    v-for="calendar in calendars"
                    :key="calendar.id"
                    class="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <input
                          type="checkbox"
                          :checked="calendarService.visibleCalendars.has(calendar.id)"
                          @change="$emit('calendarToggled', calendar.id, ($event.target as HTMLInputElement).checked)"
                          class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div
                          class="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-1"
                          :style="{ backgroundColor: calendar.color, ringColor: calendar.color + '40' }"
                      ></div>
                      <span class="font-medium text-gray-900 truncate">{{ calendar.name }}</span>
                    </div>
                    <button
                        title="Options"
                        @click.stop="toggleDropdown(calendar.id, $event, false)"
                        class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
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
              </div>

              <!-- Séparateur et liste des calendriers partagés -->
              <div v-if="sharedCalendars && sharedCalendars.length > 0" class="mt-8">
                <div class="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                       class="text-indigo-500">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Partagés avec moi</h3>
                </div>

                <div class="space-y-2">
                  <div
                      v-for="calendar in sharedCalendars"
                      :key="'shared-' + calendar.id"
                      class="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all group relative"
                  >
                    <!-- Badge partagé -->
                    <div class="absolute -top-2 -right-2">
                      <span class="inline-flex items-center justify-center w-5 h-5 bg-indigo-500 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                             stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                      </span>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            :checked="calendarService.visibleCalendars.has(calendar.id)"
                            @change="$emit('calendarToggled', calendar.id, ($event.target as HTMLInputElement).checked)"
                            class="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div
                            class="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-1"
                            :style="{ backgroundColor: calendar.color, ringColor: calendar.color + '40' }"
                        ></div>
                        <div class="flex flex-col min-w-0">
                          <span class="font-medium text-gray-900 truncate">{{ calendar.name }}</span>
                          <span class="text-xs text-indigo-500">Calendrier partagé</span>
                        </div>
                      </div>
                      <button
                          title="Options"
                          @click.stop="toggleDropdown(calendar.id, $event, true)"
                          class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-indigo-100 transition-colors opacity-0 group-hover:opacity-100"
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
                </div>
              </div>

              <!-- Message si aucun calendrier partagé -->
              <div v-else-if="!loadingCalendars && calendars.length > 0" class="mt-8">
                <div class="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                       class="text-gray-400">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Partagés avec moi</h3>
                </div>
                <div class="text-center text-gray-400 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p class="text-sm">Aucun calendrier partagé</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste des tags -->
          <div v-else-if="isTagsView" class="h-full flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 class="text-lg font-semibold text-gray-900">Liste des tags</h2>
              <button
                  @click="$emit('close')"
                  class="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
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
                    @click="handleNewTagClick"
                    class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Nouveau tag
                </button>
              </div>

              <div v-if="loadingTags" class="text-center text-gray-500 py-8">
                <svg class="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-2">Chargement...</p>
              </div>

              <div v-else-if="tags.length === 0" class="text-center text-gray-500 py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                     class="mx-auto mb-3 text-gray-300">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <p class="text-sm">Aucun tag</p>
              </div>

              <div v-else class="space-y-2">
                <div
                    v-for="tag in tags"
                    :key="tag.id"
                    class="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <div
                          class="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-1"
                          :style="{ backgroundColor: tag.color, ringColor: tag.color + '40' }"
                      ></div>
                      <span class="font-medium text-gray-900 truncate">{{ tag.name }}</span>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                          @click="handleEditTagClick(tag)"
                          class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Modifier"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                          @click="$emit('deleteTag', tag.id)"
                          class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
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

    <!-- Dropdown Menu pour calendriers personnels -->
    <Teleport to="body">
      <div
          v-if="openDropdownId !== null && !isSharedDropdown"
          class="fixed w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999]"
          :style="dropdownStyle"
          @click.stop
      >
        <button
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            @click="handleEdit(getCalendarById(openDropdownId))"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Modifier
        </button>
        <button
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            @click="handleExport(getCalendarById(openDropdownId))"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exporter .ics
        </button>
        <button
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            @click="handleShare(getCalendarById(openDropdownId))"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Partager
        </button>
        <hr class="my-1 border-gray-200"/>
        <button
            class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            @click="handleDelete(openDropdownId!)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Supprimer
        </button>
      </div>
    </Teleport>

    <!-- Dropdown Menu pour calendriers partagés (options limitées) -->
    <Teleport to="body">
      <div
          v-if="openDropdownId !== null && isSharedDropdown"
          class="fixed w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999]"
          :style="dropdownStyle"
          @click.stop
      >
        <button
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            @click="handleExport(getSharedCalendarById(openDropdownId))"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exporter .ics
        </button>
        <hr class="my-1 border-gray-200"/>
        <button
            class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            @click="handleRemoveSharedCalendar(openDropdownId!)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18"></path>
            <path d="M6 6l12 12"></path>
          </svg>
          Retirer le partage
        </button>
      </div>
    </Teleport>

    <!-- Modal de partage du calendrier -->
    <CalendarShareModal
        v-if="isShareModalOpen"
        :calendar="shareModalCalendar"
        @close="closeShareModal"
        @removeAccess="handleRemoveAccess"
    />
  </template>