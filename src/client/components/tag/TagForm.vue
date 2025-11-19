<template>
  <BaseModal @close="$emit('close')">
    <h2 class="text-xl font-bold mb-4">{{ form.id ? 'Modifier le tag' : 'Nouveau tag' }}</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Nom</label>
        <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Couleur</label>
        <div class="flex items-center gap-3">
          <input
              v-model="form.color"
              type="color"
              required
              class="w-12 h-10 border rounded-md cursor-pointer"
          />
          <input
              v-model="form.color"
              type="text"
              required
              class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#4F46E5"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
            type="button"
            class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            @click="$emit('close')"
        >
          Annuler
        </button>
        <button
            type="submit"
            class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {{ form.id ? 'Enregistrer' : 'Créer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
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

const handleSubmit = () => {
  const payload: any = {
    name: form.value.name,
    color: form.value.color
  };
  if (form.value.id) {
    payload.id = form.value.id;
  }
  emit('save', payload);
};
</script>
