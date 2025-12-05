<template>
  <BaseModal @close="$emit('close')" :maxWidth="'800px'">
    <div class="flex flex-col max-h-[85vh]">
      <!-- Header fixe -->
      <div class="flex-shrink-0 pb-4 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ form.title ? 'Modifier le' : 'Nouveau' }} rendez-vous
        </h2>
      </div>

      <!-- Contenu scrollable -->
      <div class="flex-1 overflow-y-auto py-6 px-1">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Titre -->
          <div class="group">
            <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Titre
            </label>
            <input 
              v-model="form.title" 
              type="text" 
              required 
              placeholder="Réunion d'équipe..."
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <!-- Description -->
          <div class="group">
            <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Description
            </label>
            <textarea 
              v-model="form.description" 
              rows="3" 
              placeholder="Ajouter des détails..."
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Calendrier -->
          <div class="group">
            <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendrier
            </label>
            <select 
              v-model="form.calendarId" 
              required 
              class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none bg-white cursor-pointer"
            >
              <option v-for="calendar in calendars" :key="calendar.id" :value="calendar.id">
                {{ calendar.name }}
              </option>
            </select>
          </div>

          <!-- Dates en grille 2 colonnes -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Date début -->
            <div class="group">
              <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Début
              </label>
              <input 
                v-model="form.startDate" 
                type="datetime-local" 
                required 
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <!-- Date fin -->
            <div class="group">
              <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fin
              </label>
              <input 
                v-model="form.endDate" 
                type="datetime-local" 
                required 
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <!-- Tag Selector -->
          <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
            <TagSelector v-model="form.tags" :available-tags="tags" />
          </div>

          <!-- Récurrence -->
          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-100">
            <label class="flex items-center justify-between cursor-pointer group">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <input 
                    type="checkbox" 
                    v-model="form.isRecurring" 
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
                  <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <span class="text-sm font-semibold text-gray-800">Rendez-vous récurrent</span>
                  <p class="text-xs text-gray-600">Répéter automatiquement</p>
                </div>
              </div>
              <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </label>

            <!-- Sélecteur de récurrence -->
            <div v-if="form.isRecurring" class="mt-4 animate-fadeIn">
              <select 
                v-model="form.recursionRule" 
                class="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
              >
                <option value="DAILY">Quotidien</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="YEARLY">Annuel</option>
              </select>

              <!-- Date de fin de récurrence -->
              <div class="mt-4 animate-fadeIn">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Fin de récurrence
                </label>
                <input
                    v-model="form.recursionEndDate"
                    type="datetime-local"
                    required
                    class="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl
                           focus:outline-none focus:border-purple-500 focus:ring-2
                           focus:ring-purple-100 transition-all bg-white"
                />
                <p class="text-xs text-gray-500 mt-1">
                  L’événement s'arrêtera automatiquement après cette date.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer fixe avec boutons -->
      <div class="flex-shrink-0 pt-4 border-t border-gray-200">
        <div class="flex gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            @click="handleSubmit"
            class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            {{ form.title ? '✓ Enregistrer' : '+ Créer' }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch, watchEffect } from 'vue';
import BaseModal from '../common/BaseModal.vue';
import TagSelector from '../tag/TagSelector.vue';

const props = defineProps({
  appointment: Object,
  calendars: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'save']);

const RECCURRENCE_VALUES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];


// Initialise le form
const form = ref({
  title: '',
  description: '',
  calendarId: '',
  startDate: '',
  endDate: '',
  isRecurring: false,
  recursionRule: null,
  recursionEndDate: '',
  tags: []
});

// Charge les valeurs quand on édite un RDV
watchEffect(() => {
  if (!props.appointment) return;

  form.value.title = props.appointment.title;
  form.value.description = props.appointment.description;
  form.value.calendarId = props.appointment.calendarId;
  form.value.startDate = props.appointment.startDate?.slice(0, 16);
  form.value.endDate = props.appointment.endDate?.slice(0, 16);
  form.value.tags = props.appointment.tags || [];

  // SI récursif, on coche la case et on met la bonne règle de recurrence
  if (props.appointment.recursionRule !== null && props.appointment.recursionRule !== undefined) {
    form.value.isRecurring = true;
    form.value.recursionRule = RECCURRENCE_VALUES[props.appointment.recursionRule];
    console.log("date fin recu " + props.appointment.recursionEndDate);
    form.value.recursionEndDate = props.appointment.recursionEndDate?.slice(0, 16);
  } else {
    form.value.isRecurring = false;
    form.value.recursionRule = null;
    form.value.recursionEndDate = null;
  }
});

// Si on coche "récurrent", on assigne une valeur par défaut
watch(() => form.value.isRecurring, (isRec) => {
  if (isRec && !form.value.recursionRule) {
    form.value.recursionRule = 'WEEKLY';
  }
});

const handleSubmit = () => {
  const payload = {
    ...form.value,
    isRecurring: form.value.isRecurring,
    recursionEndDate: form.value.recursionEndDate ? form.value.recursionEndDate : null
  };

  if (!form.value.isRecurring) {
    delete payload.recursionRule; // on supprime la règle de récurrence si ce n'est pas récurrent
    delete payload.recursionEndDate;
  }

  if (form.value.isRecurring && !form.value.recursionEndDate) {
    alert("La date de fin de récurrence est obligatoire.");
    return;
  }

  emit('save', payload);
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
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

/* Smooth focus transitions */
input:focus, textarea:focus, select:focus {
  transform: scale(1.01);
}

/* Custom select arrow */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}
</style>