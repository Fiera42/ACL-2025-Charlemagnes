<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg p-6 max-w-md w-full" @click.stop>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close']);
</script>
