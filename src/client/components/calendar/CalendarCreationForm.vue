<template>
  <BaseModal @close="$emit('close')" :maxWidth="'600px'">
    <div class="flex flex-col max-h-[75vh]">
      <div class="flex-shrink-0 pb-4 border-b border-gray-200">
        <div class="flex items-start justify-between">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ calendar.id ? 'Modifier le' : 'Nouveau' }} calendrier
          </h2>

          <button
              @click="$emit('close')"
              class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto py-6 px-1">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="group">
            <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Nom du calendrier
            </label>
            <input
                v-model="form.name"
                type="text"
                required
                placeholder="Travail, Personnel, Sport..."
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div class="group">
            <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
              Description
            </label>
            <textarea
                v-model="form.description"
                rows="3"
                placeholder="Ajouter une description..."
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            ></textarea>
          </div>

          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-100">
            <label class="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
              </svg>
              Couleur
            </label>

            <div class="flex items-center gap-4">
              <div class="relative group">
                <input
                    v-model="form.color"
                    type="color"
                    required
                    class="w-20 h-20 border-4 border-white rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105"
                />
                <div
                    class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                    Choisir une couleur
                  </div>
                </div>
              </div>

              <div class="flex-1">
                <input
                    v-model="form.color"
                    type="text"
                    required
                    placeholder="#4F46E5"
                    class="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-mono uppercase"
                    pattern="^#[0-9A-Fa-f]{6}$"
                />
                <p class="text-xs text-gray-500 mt-1.5 ml-1">Format: #RRGGBB</p>
              </div>
            </div>

            <div class="mt-4 flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200">
              <div
                  class="w-10 h-10 rounded-lg shadow-inner flex-shrink-0 transition-all"
                  :style="{ backgroundColor: form.color }"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-700">Aperçu du calendrier</p>
                <div class="flex items-center gap-2 mt-1">
                  <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: form.color }"
                  ></div>
                  <span class="text-sm font-medium text-gray-800 truncate">
                    {{ form.name || 'Nom du calendrier' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section Synchronisation (si URL présente) -->
          <div v-if="form.url" class="space-y-4 pt-4 border-t border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900">Synchronisation</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL source
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                       class="text-gray-400">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </div>
                <input
                  v-model="form.url"
                  type="text"
                  disabled
                  class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div v-if="form.updateRule !== null" class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2">
                    <!-- Recurrence / refresh icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12a9 9 0 11-2.64-6.12" />
                      <polyline points="23 4 23 10 17 10" />
                    </svg>
                    <label class="text-sm text-gray-700 whitespace-nowrap font-medium">
                      Mettre à jour :
                    </label>
                  </div>
                   <select
                     v-model="form.updateRule"
                     class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm transition-all cursor-pointer"
                   >
                     <option 
                       v-for="option in updateRuleOptions" 
                       :key="option.value" 
                       :value="option.value"
                     >
                       {{ option.label }}
                     </option>
                   </select>
                 </div>
             </div>
          </div>

        </form>
      </div>

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
            {{ calendar.id ? '✓ Enregistrer' : '+ Créer' }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import {ref, watchEffect} from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  calendar: {
    type: Object,
    default: () => ({name: '', description: '', color: '#4F46E5'})
  }
});

const emit = defineEmits(['close', 'save']);

const form = ref({
  id: null,
  name: '',
  description: '',
  color: '#4F46E5',
  url: null,
  updateRule: null
});

const updateRuleOptions = [
  { value: 1, label: 'Toutes les heures' },
  { value: 2, label: 'Tous les jours' },
  { value: 3, label: 'Toutes les semaines' },
  { value: 4, label: 'Tous les mois' }
];

watchEffect(() => {
  if (props.calendar) {
    form.value = {
      id: props.calendar.id || null,
      name: props.calendar.name || '',
      description: props.calendar.description || '',
      color: props.calendar.color || '#4F46E5',
      url: props.calendar.url || null,
      updateRule: props.calendar.updateRule !== undefined ? props.calendar.updateRule : null
    };
  }
});

const handleSubmit = () => {
  emit('save', {
    ...form.value,
    color: form.value.color.toUpperCase()
  });
};
</script>

<style scoped>
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 12px;
}

input[type="color"]::-moz-color-swatch {
  border: none;
  border-radius: 12px;
}

input:focus, textarea:focus {
  transform: scale(1.01);
}
</style>