<template>
  <button
    :class="[
      'rounded-lg py-2.5 px-5 text-sm font-medium transition-all duration-300',
      isActive
        ? 'text-indigo-600 bg-white'
        : 'text-gray-500 hover:bg-white hover:text-indigo-600'
    ]"
    @click="$emit('click')"
  >
    {{ label }}
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);
</script>