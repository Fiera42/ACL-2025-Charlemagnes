<template>
  <div class="min-h-screen bg-stone-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Connexion</h1>
        <p class="text-gray-600 mt-2">Accédez à votre calendrier</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            Nom d'utilisateur
          </label>
          <input
              id="username"
              v-model="credentials.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Votre nom d'utilisateur"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Votre mot de passe"
          />
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Pas encore de compte ?
          <a href="/register" class="text-blue-600 hover:text-blue-700 font-medium">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import axios from 'axios';

const router = useRouter();

const credentials = ref({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await axios.post('/api/auth/login', {
      id: credentials.value.username,
      password: credentials.value.password
    });

    if (response.status === 200 && response.data) {
      const token = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userName', credentials.value.username);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Vérifier s'il y a une redirection en attente
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        await router.push(redirectUrl);
      } else {
        await router.push('/');
      }
    }
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Utilisateur inconnu';
    } else if (err.response?.status === 401) {
      error.value = 'Mot de passe incorrect';
    } else {
      error.value = err.message || 'Erreur de connexion';
    }
  } finally {
    loading.value = false;
  }
};
</script>