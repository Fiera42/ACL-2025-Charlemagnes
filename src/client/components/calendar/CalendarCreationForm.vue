<template>
  <BaseModal @close="$emit('close')">
    <h2 class="text-xl font-bold mb-4">Nouveau calendrier</h2>
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Nom</label>
        <input v-model="form.name" type="text" required class="w-full px-4 py-2 border rounded-lg" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Description</label>
        <textarea v-model="form.description" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Couleur</label>
        <input v-model="form.color" type="color" required class="w-full px-4 py-2 border rounded-lg">
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg">Créer</button>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  calendar: Object
});

const emit = defineEmits(['close', 'create']);

const form = ref({
  id: props.calendar?.id || '',
  name: props.calendar?.name || '',
  description: props.calendar?.description || '',
  color: props.calendar?.color || '#63a6a0'
});

const handleSubmit = () => {
  emit('create', form.value);
};

</script>