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
defineProps({
  userName: {
    type: String,
    default: 'Utilisateur'
  }
});

defineEmits(['toggleSidebar', 'logout']);
</script>