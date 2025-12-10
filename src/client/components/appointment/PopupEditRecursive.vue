<template>
  <BaseModal @close="$emit('close')" :maxWidth="'400px'">

      <h2 class="text-lg font-semibold mb-4">Modifier la récurrence</h2>

      <p class="text-sm text-gray-600 mb-6">
        Voulez-vous modifier cette occurrence ou toute la récurrence ?
      </p>

      <div class="flex flex-col gap-3">
        <button
            class="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            @click="$emit('choice','single')"
        >
          Modifier cette occurrence
        </button>

        <button
            class="bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
            @click="$emit('choice','all')"
        >
          Modifier toute la récurrence
        </button>
      </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "../common/BaseModal.vue";

defineEmits(["choice", "close"]);
</script>