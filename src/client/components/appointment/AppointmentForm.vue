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
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">RDV Récurrent ?</label>
        <div class="flex items-center justify-between">
          <div class="ml-4 px-3 py-2">
            <input type="checkbox" v-model="form.isRecurring" class="mr-2" />
          </div>
          <select v-model="form.recursionRule" :hidden="!form.isRecurring" class="ml-4 px-3 py-2 border rounded-lg w-1/2">
            <option value="DAILY">Quotidien</option>
            <option value="WEEKLY">Hebdomadaire</option>
            <option value="MONTHLY">Mensuel</option>
            <option value="YEARLY">Annuel</option>
          </select>
        </div>
      </div>
      
      <button type="submit" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg">Créer</button>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, watch, watchEffect } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  appointment: Object,
  calendars: {
    type: Array,
    default: () => []
  },
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
  recursionRule: null
});

// Charge les valeurs quand on édite un RDV
watchEffect(() => {
  if (!props.appointment) return;

  form.value.title = props.appointment.title;
  form.value.description = props.appointment.description;
  form.value.calendarId = props.appointment.calendarId;

  form.value.startDate = props.appointment.startDate?.slice(0, 16);
  form.value.endDate = props.appointment.endDate?.slice(0, 16);

  // SI récursif, on coche la case et on met la bonne règle de recurrence
  if (props.appointment.recursionRule !== null && props.appointment.recursionRule !== undefined) {
    form.value.isRecurring = true;
    form.value.recursionRule = RECCURRENCE_VALUES[props.appointment.recursionRule];
  } else {
    form.value.isRecurring = false;
    form.value.recursionRule = null;
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
  };

  if (!form.value.isRecurring) {
    delete payload.recursionRule; // on supprime la règle de récurrence si ce n'est pas récurrent
  }

  emit('save', payload);
};
</script>