<template>
  <div class="page-container">
    <div class="card-container">
      <div class="page-header-center">
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
        <h1 class="section-title">Calendrier partagé</h1>
      </div>

      <!-- État de chargement -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p class="mt-4 text-gray-600">Traitement en cours...</p>
      </div>

      <!-- Succès -->
      <div v-else-if="success" class="status-container">
        <div class="success-icon-container">
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
            class="btn-primary"
        >
          Accéder à mes calendriers
        </button>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="status-container">
        <div class="error-icon-container">
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
              class="btn-primary"
          >
            Réessayer
          </button>
          <button
              @click="goToHome"
              class="btn-secondary"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>

      <!-- Confirmation initiale -->
      <div v-else class="status-container">
        <p class="text-gray-600 mb-6">
          Voulez-vous ajouter ce calendrier partagé à votre liste ?
        </p>
        <div class="space-y-3">
          <button
              @click="acceptShare"
              class="btn-primary"
          >
            Accepter le partage
          </button>
          <button
              @click="goToHome"
              class="btn-secondary"
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