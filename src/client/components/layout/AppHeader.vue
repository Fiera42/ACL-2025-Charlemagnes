<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div class="px-3 sm:px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Menu burger + Logo (collés à gauche) -->
        <div class="flex items-center gap-2">
          <button @click="$emit('toggleSidebar')"
            class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                  d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                  stroke="#4F46E5" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round"
                  stroke-linejoin="round"/>
              <path
                  d="M15.6947 13.7H15.7037M15.6947 16.7H15.7037M11.9955 13.7H12.0045M11.9955 16.7H12.0045M8.29431 13.7H8.30329M8.29431 16.7H8.30329"
                  stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h1 class="text-xl font-bold text-gray-900">Charl'endar</h1>
          </div>
        </div>

        <!-- Barre de recherche -->
        <div class="relative w-full max-w-md mx-4">
          <div class="relative group">
            <svg xmlns="http://www.w3.org/2000/svg"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
            </svg>

            <input v-model="searchQuery" type="text" placeholder="Rechercher un rendez-vous..." class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-2.5 text-sm
                       placeholder-gray-400 text-gray-700
                       focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
                       hover:border-gray-300 hover:bg-gray-100
                       transition-all duration-200" />

            <SearchDropdown :results="searchResults" :visible="searchQuery.length > 0" @select="handleSelectResult" />

            <button v-if="searchQuery" @click="clearSearch"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Bouton filtre -->
        <div class="relative">
          <button @click="showFilters = !showFilters" :class="[
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
            hasActiveFilters
              ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300 shadow-sm'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          ]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5"
              :class="hasActiveFilters ? 'text-indigo-600' : 'text-gray-500'" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-6 7v6l-4-2v-4L3 6V4z" />
            </svg>
            <span class="hidden sm:inline">Filtres</span>
            <span v-if="activeFiltersCount > 0"
              class="ml-1 px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
              {{ activeFiltersCount }}
            </span>
          </button>

          <!-- Menu déroulant des filtres -->
          <Transition enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-2 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-2 scale-95">
            <div v-if="showFilters"
              class="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <!-- Header du menu -->
              <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-6 7v6l-4-2v-4L3 6V4z" />
                    </svg>
                    <h3 class="text-white font-semibold text-lg">Filtres</h3>
                  </div>
                  <button @click="showFilters = false" class="text-white/80 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Contenu scrollable -->
              <div class="max-h-[60vh] overflow-y-auto p-5 space-y-5">

                <!-- Date de début -->
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date de début
                  </label>
                  <div class="flex items-center gap-2">
                    <select v-model="startOperator"
                      class="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
                      <option value=">">Après</option>
                      <option value="<">Avant</option>
                    </select>
                    <input type="date" v-model="startDate"
                      class="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" />
                  </div>
                </div>

                <!-- Date de fin -->
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date de fin
                  </label>
                  <div class="flex items-center gap-2">
                    <select v-model="endOperator"
                      class="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium bg-gray-50 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
                      <option value=">">Après</option>
                      <option value="<">Avant</option>
                    </select>
                    <input type="date" v-model="endDate"
                      class="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" />
                  </div>
                </div>

                <!-- Tags -->
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 7h. 01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1. 994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tags
                    <span v-if="selectedTags.length > 0" class="text-xs text-indigo-600 font-normal">
                      ({{ selectedTags.length }} sélectionné{{ selectedTags.length > 1 ? 's' : '' }})
                    </span>
                  </label>

                  <!-- Tags sélectionnés -->
                  <div v-if="selectedTags.length > 0"
                    class="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <div v-for="tagId in selectedTags" :key="tagId"
                      class="inline-flex items-center gap-1. 5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all hover:scale-105"
                      :style="{
                        backgroundColor: getTagById(tagId)?.color,
                        color: getContrastColor(getTagById(tagId)?.color || '#000000')
                      }">
                      <span>{{ getTagById(tagId)?.name }}</span>
                      <button type="button" @click="toggleTag(tagId)"
                        class="hover:bg-black/10 rounded-full p-0.5 transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Liste des tags disponibles -->
                  <div v-if="tags.length > 0" class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    <button v-for="tag in tags" :key="tag.id" type="button" @click="toggleTag(tag.id)" :class="[
                      'group relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-left',
                      'flex items-center gap-2',
                      isTagSelected(tag.id)
                        ? 'ring-2 ring-offset-1 shadow-md scale-[1.02]'
                        : 'hover:scale-[1.02] hover:shadow-sm border'
                    ]" :style="{
                        backgroundColor: isTagSelected(tag.id) ? tag.color : 'transparent',
                        color: isTagSelected(tag.id) ? getContrastColor(tag.color) : tag.color,
                        borderColor: isTagSelected(tag.id) ? 'transparent' : tag.color + '40',
                        ringColor: tag.color
                      }">
                      <span v-if="!isTagSelected(tag.id)" class="w-2. 5 h-2.5 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: tag.color }"></span>
                      <span class="flex-1 truncate">{{ tag.name }}</span>
                      <svg v-if="isTagSelected(tag.id)" class="w-3. 5 h-3.5 flex-shrink-0" fill="currentColor"
                        viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div v-else class="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M7 7h. 01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p class="text-xs text-gray-500">Aucun tag disponible</p>
                  </div>
                </div>

                <!-- Récurrence -->
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <div class="flex items-center gap-3">
                      <div class="relative">
                        <input type="checkbox" v-model="showRecurring" class="sr-only peer" />
                        <div class="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-indigo-600 transition-colors">
                        </div>
                        <div
                          class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm">
                        </div>
                      </div>
                      <div>
                        <span class="text-sm font-semibold text-gray-800">Récurrents</span>
                        <p class="text-xs text-gray-600">Afficher les RDV récurrents</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-purple-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h. 582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </label>
                </div>

              </div>

              <!-- Footer avec boutons -->
              <div class="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <div class="flex gap-3">
                  <button @click="resetFilters"
                    class="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-100 hover:border-gray-400 transition-all">
                    Réinitialiser
                  </button>
                  <button @click="applyFilters"
                    class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Profil + Déconnexion (collés à droite) -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            @click="goToProfile">
            <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ userName }}</span>
          </div>

          <button @click="$emit('logout')"
            class="px-3 py-1. 5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="inline-block sm:hidden">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span class="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import SearchDropdown from './SearchDropdown.vue';

const router = useRouter();

const props = defineProps({
  userName: {
    type: String,
    default: 'Utilisateur'
  },
  resetSearchKey: {
    type: Number,
    default: 0
  },
  resetFiltersKey: {
    type: Number,
    default: 0
  },
  appointments: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['toggleSidebar', 'logout', 'search', 'filters-changed', 'selectAppointment']);
const searchQuery = ref('');
const searchResults = ref([]);

// Champs pour filtre
const showFilters = ref(false);
const startDate = ref('');
const endDate = ref('');
const startOperator = ref('>');
const endOperator = ref('>');
const showRecurring = ref(true);
const selectedTags = ref([]);

// Computed pour savoir si des filtres sont actifs
const hasActiveFilters = computed(() => {
  return startDate.value || endDate.value || selectedTags.value.length > 0 || !showRecurring.value;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (startDate.value) count++;
  if (endDate.value) count++;
  if (selectedTags.value.length > 0) count++;
  if (!showRecurring.value) count++;
  return count;
});

// Fonctions pour gérer les tags
const isTagSelected = (tagId) => {
  return selectedTags.value.includes(tagId);
};

const toggleTag = (tagId) => {
  if (isTagSelected(tagId)) {
    selectedTags.value = selectedTags.value.filter(id => id !== tagId);
  } else {
    selectedTags.value.push(tagId);
  }
};

const getTagById = (tagId) => {
  return props.tags.find(tag => tag.id === tagId);
};

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#FFFFFF';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
};

const goToProfile = () => {
  router.push({ name: 'profile' });
};

// Recherche avec délai
let debounceTimeout;
watch(searchQuery, (newValue) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    if (!newValue) {
      searchResults.value = [];
      return;
    }

    if (!props.appointments?.length) return [];

    searchResults.value = props.appointments.flatMap(a => {
      const text = `${a.title ?? ''} ${a.description ?? ''}`.toLowerCase();
      if (!text.includes(newValue.toLowerCase())) return [];

      if (a.recursionRule !== undefined && a.recursionRule !== null && showRecurring.value) {
        const occurrences = [];
        let start = new Date(a.startDate);
        let end = new Date(a.endDate);
        const duration = end - start;
        const limitDate = new Date();
        limitDate.setMonth(limitDate.getMonth() + 1);

        let recurrenceEnd = a.recursionEndDate ? new Date(a.recursionEndDate) : limitDate;
        recurrenceEnd = recurrenceEnd < limitDate ? recurrenceEnd : limitDate;

        while (end <= recurrenceEnd) {
          occurrences.push({ ...a, startDate: new Date(start), endDate: new Date(end) });
          switch (a.recursionRule) {
            case 0:
              start.setDate(start.getDate() + 1);
              break;
            case 1:
              start.setDate(start.getDate() + 7);
              break;
            case 2:
              start.setMonth(start.getMonth() + 1);
              break;
            case 3:
              start.setFullYear(start.getFullYear() + 1);
              break;
          }
          end = new Date(start.getTime() + duration);
        }

        return occurrences;
      }

      return [a];
    })
  }, 300);
});

const handleSelectResult = (appointment) => {
  emit('selectAppointment', appointment);
  searchQuery.value = '';
  searchResults.value = [];
};

watch(() => props.resetFiltersKey, () => {
  startDate.value = '';
  endDate.value = '';
  startOperator.value = '>';
  endOperator.value = '>';
  selectedTags.value = [];
  showRecurring.value = true;
});

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  emit('search', '');
};

const applyFilters = () => {
  showFilters.value = false;
  emit('filters-changed', {
    startDate: startDate.value,
    startOperator: startOperator.value,
    endDate: endDate.value,
    endOperator: endOperator.value,
    showRecurring: showRecurring.value,
    selectedTags: selectedTags.value
  });
};

const resetFilters = () => {
  startDate.value = '';
  endDate.value = '';
  startOperator.value = '>';
  endOperator.value = '>';
  selectedTags.value = [];
  showRecurring.value = true;
  emit('filters-changed', {});
};
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>