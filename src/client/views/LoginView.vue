<template>
  <div class="page-container">
    <div class="card-container">
      <div class="page-header-center">
        <h1 class="page-title">Connexion</h1>
        <p class="page-subtitle">Accédez à votre calendrier</p>
      </div>

      <form @submit.prevent="handleLogin" class="form-container">
        <div>
          <label for="username" class="form-label">
            Nom d'utilisateur
          </label>
          <input
              id="username"
              v-model="credentials.username"
              type="text"
              required
              class="form-input"
              placeholder="Votre nom d'utilisateur"
          />
        </div>

        <div>
          <label for="password" class="form-label">
            Mot de passe
          </label>
          <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              class="form-input"
              placeholder="Votre mot de passe"
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
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="link-text">
          Pas encore de compte ?
          <a href="/register" class="link-primary">
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