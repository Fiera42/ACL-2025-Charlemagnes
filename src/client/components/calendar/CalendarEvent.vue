<template>
  <div
    :class="[
      'rounded p-1.5 border-l-2 cursor-pointer',
      colorClass
    ]"
    @click="$emit('click')"
  >
    <p class="text-xs font-normal text-gray-900 mb-px truncate">{{ title }}</p>
    <p :class="['text-xs font-semibold', textColor]">{{ time }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  colorClass: {
    type: String,
    default: 'border-blue-600 bg-blue-50'
  },
  textColor: {
    type: String,
    default: 'text-blue-600'
  }
});

defineEmits(['click']);
</script>