<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div 
      class="bg-white rounded-2xl shadow-2xl w-full p-6"
      :style="{ maxWidth: maxWidth }"
      @click.stop
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  maxWidth: {
    type: String,
    default: '600px'
  }
});

defineEmits(['close']);
</script>
