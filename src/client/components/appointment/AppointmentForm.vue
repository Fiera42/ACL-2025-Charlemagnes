<template>
  <BaseModal @close="$emit('close')">
    <h2 class="text-xl font-bold mb-4">Nouveau rendez-vous</h2>
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Titre</label>
        <input v-model="form.title" type="text" required class="w-full px-4 py-2 border rounded-lg" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Description</label>
        <textarea v-model="form.description" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Calendrier</label>
        <select v-model="form.calendarId" required class="w-full px-4 py-2 border rounded-lg">
          <option v-for="calendar in calendars" :value="calendar.id">
            {{ calendar.name }}
          </option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Date & heure de début</label>
        <input v-model="form.startDate" type="datetime-local" required class="w-full px-4 py-2 border rounded-lg" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Date & heure de fin</label>
        <input v-model="form.endDate" type="datetime-local" required class="w-full px-4 py-2 border rounded-lg" />
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg">Créer</button>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  appointment: Object,
  calendars: {
    type: Array,
    default: () => []
  },
});

const emit = defineEmits(['close', 'save']);

const form = ref({
  title: props.appointment?.title || '',
  description: props.appointment?.description || '',
  calendarId: props.appointment?.calendarId || '',
  startDate: props.appointment?.startDate || '',
  endDate: props.appointment?.endDate || ''
});

const handleSubmit = () => {
  emit('save', form.value);
};
</script>
