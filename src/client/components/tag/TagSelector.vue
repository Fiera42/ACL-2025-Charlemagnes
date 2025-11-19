<template>
  <div class="tag-selector">
    <div class="flex items-center justify-between mb-3">
      <label class="block text-sm font-medium text-gray-700">
        Tags
        <span v-if="selectedTags.length > 0" class="ml-2 text-xs text-gray-500">
          ({{ selectedTags.length }} sélectionné{{ selectedTags.length > 1 ? 's' : '' }})
        </span>
      </label>
      <button
        v-if="selectedTags.length > 0"
        type="button"
        @click="clearAll"
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        Tout effacer
      </button>
    </div>
    
    <div v-if="availableTags.length === 0" class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <p class="text-sm text-gray-500">Aucun tag disponible</p>
      <p class="text-xs text-gray-400 mt-1">Créez-en un dans la sidebar !</p>
    </div>
    
    <div v-else class="relative">
      <!-- Selected Tags Display -->
      <div v-if="selectedTags.length > 0" class="mb-3 flex flex-wrap gap-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <TransitionGroup name="tag-fade">
          <div
            v-for="tagId in selectedTags"
            :key="tagId"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all hover:scale-105"
            :style="{
              backgroundColor: getTagById(tagId)?.color,
              color: getContrastColor(getTagById(tagId)?.color || '#000000')
            }"
          >
            <span>{{ getTagById(tagId)?.name }}</span>
            <button
              type="button"
              @click.stop="toggleTag(tagId)"
              class="hover:bg-black/10 rounded-full p-0.5 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </TransitionGroup>
      </div>

      <!-- Available Tags Grid -->
      <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 rounded-lg border border-gray-200 bg-white">
        <button
          v-for="tag in availableTags"
          :key="tag.id"
          type="button"
          @click="toggleTag(tag.id)"
          :class="[
            'group relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left',
            'flex items-center gap-2',
            isSelected(tag.id)
              ? 'ring-2 ring-offset-1 shadow-md scale-[1.02]'
              : 'hover:scale-[1.02] hover:shadow-sm border'
          ]"
          :style="{
            backgroundColor: isSelected(tag.id) ? tag.color : 'transparent',
            color: isSelected(tag.id) ? getContrastColor(tag.color) : tag.color,
            borderColor: isSelected(tag.id) ? 'transparent' : tag.color + '40',
            ringColor: tag.color
          }"
        >
          <!-- Color Dot (only when not selected) -->
          <span
            v-if="!isSelected(tag.id)"
            class="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
            :style="{ backgroundColor: tag.color }"
          ></span>
          
          <!-- Tag Name -->
          <span class="flex-1 truncate">{{ tag.name }}</span>
          
          <!-- Check Icon (only when selected) -->
          <svg
            v-if="isSelected(tag.id)"
            class="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- Hover Plus Icon (only when not selected) -->
          <svg
            v-else
            class="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Tag {
  id: string;
  name: string;
  color: string;
}

const props = defineProps<{
  availableTags: Tag[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const selectedTags = ref<string[]>([...props.modelValue]);

watch(() => props.modelValue, (newVal) => {
  console.log('🏷️ TagSelector - nouveaux tags reçus:', newVal);
  selectedTags.value = [...newVal];
});

watch(() => props.availableTags, (newVal) => {
  console.log('📋 TagSelector - tags disponibles:', newVal);
}, { immediate: true });

watch(selectedTags, (newVal) => {
  console.log('✅ TagSelector - tags sélectionnés changés:', newVal);
}, { deep: true });

const isSelected = (tagId: string): boolean => {
  return selectedTags.value.includes(tagId);
};

const toggleTag = (tagId: string) => {
  if (isSelected(tagId)) {
    selectedTags.value = selectedTags.value.filter(id => id !== tagId);
  } else {
    selectedTags.value.push(tagId);
  }
  emit('update:modelValue', selectedTags.value);
};

const clearAll = () => {
  selectedTags.value = [];
  emit('update:modelValue', []);
};

const getTagById = (tagId: string): Tag | undefined => {
  return props.availableTags.find(tag => tag.id === tagId);
};

const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
};
</script>

<style scoped>
.tag-fade-enter-active,
.tag-fade-leave-active {
  transition: all 0.3s ease;
}

.tag-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.tag-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.tag-fade-move {
  transition: transform 0.3s ease;
}
</style>
