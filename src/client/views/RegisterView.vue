<template>
  <div class="page-container">
    <div class="card-container">
      <div class="page-header-center">
        <h1 class="page-title">Inscription</h1>
        <p class="page-subtitle">Créez votre compte</p>
      </div>

      <form @submit.prevent="handleRegister" class="form-container">
        <div>
          <label for="username" class="form-label">
            Nom d'utilisateur
          </label>
          <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="form-input"
              placeholder="Choisissez un nom d'utilisateur"
          />
        </div>

        <div>
          <label for="password" class="form-label">
            Mot de passe
          </label>
          <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              class="form-input"
              placeholder="Choisissez un mot de passe"
          />
        </div>

        <div>
          <label for="confirmPassword" class="form-label">
            Confirmer le mot de passe
          </label>
          <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="form-input"
              placeholder="Confirmez votre mot de passe"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
        >
          {{ loading ? 'Création du compte...' : 'S\'inscrire' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="link-text">
          Déjà un compte ?
          <a href="/login" class="link-primary">
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

      localStorage.setItem('token', token);
      localStorage.setItem('userName', formData.value.username);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

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