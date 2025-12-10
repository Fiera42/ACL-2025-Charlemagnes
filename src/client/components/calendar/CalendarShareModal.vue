<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Partager le calendrier</h2>
        <button
            @click="close"
            class="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-6">
        <!-- Calendrier info -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div
              class="w-4 h-4 rounded-full"
              :style="{ backgroundColor: calendar?.color || '#3B82F6' }"
          ></div>
          <span class="font-medium text-gray-900">{{ calendar?.name || 'Calendrier' }}</span>
        </div>

        <!-- Section lien de partage -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Lien de partage (lecture seule)</h3>
          <div class="flex gap-2">
            <input
                type="text"
                :value="shareLink"
                readonly
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
            />
            <button
                @click="copyLink"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{{ copied ? 'Copié !' : 'Copier' }}</span>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Les personnes ayant ce lien pourront consulter votre calendrier en lecture seule.
          </p>
        </div>

        <!-- Section utilisateurs partagés -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Utilisateurs ayant accès</h3>
          <div class="border border-gray-200 rounded-lg min-h-[120px] max-h-[200px] overflow-y-auto">
            <div v-if="loading" class="flex items-center justify-center py-8 text-gray-400">
              <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div v-else-if="sharedUsers.length === 0"
                 class="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                   class="mb-2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p class="text-sm">Aucun utilisateur n'a encore accès</p>
            </div>
            <ul v-else class="divide-y divide-gray-200">
              <li
                  v-for="user in sharedUsers"
                  :key="user.id"
                  class="flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span class="text-sm font-medium text-indigo-600">
                              {{ user.username?.charAt(0)?.toUpperCase() || '?' }}
                            </span>
                  </div>
                  <span class="text-sm text-gray-900">{{ user.username }}</span>
                </div>
                <button
                    @click="removeAccess(user.id)"
                    class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Retirer l'accès"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 p-4 border-t border-gray-200">
        <button
            @click="close"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue';
import axios from 'axios';

const props = defineProps({
  calendar: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'removeAccess']);

const copied = ref(false);
const sharedUsers = ref([]);
const loading = ref(false);

const shareLink = computed(() => {
  if (!props.calendar?.id) return '';
  return `${window.location.origin}/shared/calendar/${props.calendar.id}`;
});

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const fetchSharedUsers = async () => {
  if (!props.calendar?.id) return;

  loading.value = true;
  try {
    const token = getAuthToken();
    const response = await axios.get(`/api/share/calendar/${props.calendar.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const shares = response.data.shares || [];

    // Récupérer les informations de chaque utilisateur par ID
    const usersPromises = shares.map(async (share) => {
      try {
        const userResponse = await axios.get(`/api/auth/user/id/${share.userShareId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return {
          id: share.userShareId,
          shareId: share.id,
          username: userResponse.data.username || 'Utilisateur inconnu'
        };
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'utilisateur ${share.userShareId}:`, error);
        return {
          id: share.userShareId,
          shareId: share.id,
          username: 'Utilisateur inconnu'
        };
      }
    });

    sharedUsers.value = await Promise.all(usersPromises);
  } catch (error) {
    console.error('Erreur lors de la récupération des partages:', error);
    sharedUsers.value = [];
  } finally {
    loading.value = false;
  }
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Erreur lors de la copie du lien:', error);
  }
};

const removeAccess = async (userId) => {
  try {
    await axios.delete(`/api/share/calendar/${props.calendar?.id}/user/${userId}`);
    // Retirer l'utilisateur de la liste locale
    sharedUsers.value = sharedUsers.value.filter(u => u.id !== userId);
  } catch (error) {
    console.error('Erreur lors de la suppression du partage:', error);
    alert('Erreur lors de la suppression du partage');
  }
};

const close = () => {
  emit('close');
};

onMounted(() => {
  fetchSharedUsers();
});

watch(() => props.calendar?.id, () => {
  fetchSharedUsers();
});
</script>
