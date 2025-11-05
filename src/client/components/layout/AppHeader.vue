<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div class="px-3 sm:px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Menu burger + Logo (collés à gauche) -->
        <div class="flex items-center gap-2">
          <button
              @click="$emit('toggleSidebar')"
              class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
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
            <h1 class="text-xl font-bold text-gray-900">Mon Calendrier</h1>
          </div>
        </div>

        <div class="relative w-full max-w-md">
          <!-- Loupe à gauche -->
          <svg
              xmlns="http://www.w3.org/2000/svg"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
          </svg>

          <!-- Champ -->
          <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un rendez-vous..."
              class="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2 text-sm
           focus:ring-0 focus:border-indigo-500 outline-none transition-colors"
          />

          <!-- Croix à droite -->
          <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <!-- Bouton filtre -->
        <div class="relative">
          <button
              @click="showFilters = !showFilters"
              class="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2l-6 7v6l-4-2v-4L3 6V4z"/>
            </svg>
            <span>Filtres</span>
          </button>

          <!-- Menu déroulant -->
          <div
              v-if="showFilters"
              class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
          >
            <h3 class="text-sm font-medium mb-2 text-gray-700">Date de début</h3>
            <div class="flex items-center gap-2 mb-3">
              <select v-model="startOperator" class="border rounded p-1 text-sm">
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
              </select>
              <input type="date" v-model="startDate" class="border rounded p-1 text-sm flex-1"/>
            </div>

            <h3 class="text-sm font-medium mb-2 text-gray-700">Date de fin</h3>
            <div class="flex items-center gap-2 mb-3">
              <select v-model="endOperator" class="border rounded p-1 text-sm">
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
              </select>
              <input type="date" v-model="endDate" class="border rounded p-1 text-sm flex-1"/>
            </div>

            <div class="flex justify-between mt-4">
              <button @click="resetFilters" class="text-gray-500 text-sm hover:underline">Réinitialiser</button>
              <button @click="applyFilters" class="bg-indigo-500 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-600">Appliquer</button>
            </div>
          </div>
        </div>

        <!-- Profil + Déconnexion (collés à droite) -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ userName }}</span>
          </div>

          <button
              @click="$emit('logout')"
              class="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
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
import { ref, watch } from 'vue';

const props = defineProps({
  userName: {
    type: String,
    default: 'Utilisateur'
  },
  resetSearchKey: {  // Pour reset la barre de recherche
    type: Number,
    default: 0
  },
  resetFiltersKey: {  // Pour reset les filtres
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['toggleSidebar', 'logout', 'search', 'filters-changed']);
const searchQuery = ref('');

// Champs pour filtre
const showFilters = ref(false);
const startDate = ref('');
const endDate = ref('');
const startOperator = ref('>');
const endOperator = ref('>');

// On émet l'événement de recherche avec un délai pour éviter trop d'appels successifs
let debounceTimeout;
watch(searchQuery, (newValue) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    emit('search', newValue);
  }, 500);
});

// Réinitialisation depuis App.vue
watch(() => props.resetSearchKey, () => {
  searchQuery.value = '';
});

watch(() => props.resetFiltersKey, () => {
  // quand App.vue réinitialise les filtres globalement
  startDate.value = '';
  endDate.value = '';
  startOperator.value = '>';
  endOperator.value = '>';
});

// Bouton pour vider localement
const clearSearch = () => {
  searchQuery.value = '';
  emit('search', ''); // notifie App.vue pour réafficher tout
};

// Appliquer les filtres
const applyFilters = () => {
  showFilters.value = false;
  emit('filters-changed', {
    startDate: startDate.value,
    startOperator: startOperator.value,
    endDate: endDate.value,
    endOperator: endOperator.value
  });
};

// Réinitialiser les filtres
const resetFilters = () => {
  startDate.value = '';
  endDate.value = '';
  startOperator.value = '>';
  endOperator.value = '>';
  emit('filters-changed', {}); // envoie vide = plus de filtres
};

</script>