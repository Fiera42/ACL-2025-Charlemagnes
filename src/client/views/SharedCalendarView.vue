<template>
  <div class="min-h-screen bg-stone-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
      <div class="text-center mb-8">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4F46E5"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-auto mb-4"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <h1 class="text-2xl font-bold text-gray-900">Calendrier partagé</h1>
      </div>

      <!-- État de chargement -->
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Traitement en cours...</p>
      </div>

      <!-- Succès -->
      <div v-else-if="success" class="text-center py-6">
        <div class="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#059669"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Calendrier ajouté !</h2>
        <p class="text-gray-600 mb-6">Le calendrier a été ajouté à votre liste.</p>
        <button
            @click="goToHome"
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Accéder à mes calendriers
        </button>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="text-center py-6">
        <div class="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
        <p class="text-gray-600 mb-6">{{ errorMessage }}</p>
        <div class="space-y-3">
          <button
              @click="retry"
              class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Réessayer
          </button>
          <button
              @click="goToHome"
              class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>

      <!-- Confirmation initiale -->
      <div v-else class="text-center py-6">
        <p class="text-gray-600 mb-6">
          Voulez-vous ajouter ce calendrier partagé à votre liste ?
        </p>
        <div class="space-y-3">
          <button
              @click="acceptShare"
              class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Accepter le partage
          </button>
          <button
              @click="goToHome"
              class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const success = ref(false);
const error = ref(false);
const errorMessage = ref('');

const calendarId = ref('');

onMounted(() => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Sauvegarder l'URL pour rediriger après connexion
    localStorage.setItem('redirectAfterLogin', route.fullPath);
    router.push('/login');
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  calendarId.value = route.params.calendarId;
});

const acceptShare = async () => {
  loading.value = true;
  error.value = false;
  success.value = false;

  try {
    await axios.post(`/api/share/accept/${calendarId.value}`);
    success.value = true;
  } catch (err) {
    error.value = true;

    if (err.response?.status === 404) {
      errorMessage.value = 'Ce calendrier n\'existe pas ou le lien est invalide.';
    } else if (err.response?.status === 400) {
      errorMessage.value = 'Vous ne pouvez pas partager un calendrier avec vous-même.';
    } else if (err.response?.status === 409) {
      errorMessage.value = 'Ce calendrier est déjà partagé avec vous.';
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.setItem('redirectAfterLogin', route.fullPath);
      router.push('/login');
      return;
    } else {
      errorMessage.value = err.response?.data?.error || 'Une erreur est survenue.';
    }
  } finally {
    loading.value = false;
  }
};

const retry = () => {
  error.value = false;
  acceptShare();
};

const goToHome = () => {
  router.push('/');
};
</script>