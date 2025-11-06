<template>
  <div class="min-h-screen bg-stone-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Inscription</h1>
        <p class="text-gray-600 mt-2">Créez votre compte</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            Nom d'utilisateur
          </label>
          <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Choisissez un nom d'utilisateur"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Choisissez un mot de passe"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le mot de passe
          </label>
          <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirmez votre mot de passe"
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
          {{ loading ? 'Création du compte...' : 'S\'inscrire' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Déjà un compte ?
          <a href="/login" class="text-blue-600 hover:text-blue-700 font-medium">
            Se connecter
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
import {calendarService} from "../assets/calendar.js";

const router = useRouter();

const formData = ref({
  username: '',
  email: '',
  password: ''
});

const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  if (formData.value.password !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await axios.post('/api/auth/register', formData.value);

    if (response.status === 201 && response.data) {
      const token = response.data;

      // Configurer le token dans axios AVANT l'appel à createCalendar
      localStorage.setItem('token', token);
      localStorage.setItem('userName', formData.value.username);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Maintenant createCalendar aura accès au token
      await calendarService.createCalendar({
        name: "Calendrier 1",
        description: "Calendrier par défaut",
        color: "#63a6a0"
      });

      await router.push('/');
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.';
  } finally {
    loading.value = false;
  }
};
</script>
