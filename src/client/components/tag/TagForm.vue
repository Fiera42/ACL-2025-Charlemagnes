<template>
  <BaseModal @close="$emit('close')" :maxWidth="'600px'">
    <div class="flex flex-col max-h-[75vh]">
      <div class="flex-shrink-0 pb-4 border-b border-gray-200">
        <div class="flex items-start justify-between">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ form.id ? 'Modifier le' : 'Nouveau' }} tag
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              Nom du tag
            </label>
            <input
                v-model="form.name"
                type="text"
                required
                placeholder="Travail, Personnel, Urgent..."
                class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
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
                  class="w-10 h-10 rounded-full shadow-inner flex-shrink-0 transition-all"
                  :style="{ backgroundColor: form.color }"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-700">Aperçu du tag</p>
                <div
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 shadow-sm"
                    :style="{
                    backgroundColor: form.color, 
                    color: getContrastColor(form.color) 
                  }"
                >
                  {{ form.name || 'Nom du tag' }}
                </div>
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
            {{ form.id ? '✓ Enregistrer' : '+ Créer' }}
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  tag: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const getInitialForm = () => ({
  id: null as string | null,
  name: '',
  color: '#4F46E5'
});

const form = ref(getInitialForm());

watchEffect(() => {
  if (!props.tag) {
    form.value = getInitialForm();
    return;
  }
  form.value = {
    id: props.tag.id ?? null,
    name: props.tag.name ?? '',
    color: props.tag.color ?? '#4F46E5'
  };
});

const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
};

const handleSubmit = () => {
  const payload: any = {
    name: form.value.name,
    color: form.value.color.toUpperCase()
  };
  if (form.value.id) {
    payload.id = form.value.id;
  }
  emit('save', payload);
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

input:focus {
  transform: scale(1.01);
}
</style>
