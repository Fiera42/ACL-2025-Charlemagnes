<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['close', 'submit']);

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String as () => 'import' | 'export',
    default: 'import'
  },
  calendar: {
    type: Object,
    default: null
  },
  appointments: {
    type: Array,
    default: () => []
  }
});

const config = computed(() => ({
  title: props.mode === 'import' ? 'Importer un calendrier' : 'Exporter le calendrier',
  submitLabel: props.mode === 'import' ? 'Importer' : 'Exporter',
  submitIcon: props.mode === 'import' ? 'upload' : 'download',
  fileTabLabel: props.mode === 'import' ? 'Depuis un fichier' : 'Télécharger le fichier',
  urlTabLabel: props.mode === 'import' ? 'Depuis une URL' : 'Copier le lien'
}));

const activeTab = ref<'file' | 'url'>('file');

const icsUrl = ref('');
const selectedFile = ref<File | null>(null);
const fileName = ref('');
const enableAutoUpdate = ref(false);
const updateRule = ref<number>(2); // Par défaut : DAILY

const exportUrl = ref('');
const copied = ref(false);

const updateRuleOptions = [
  { value: 1, label: 'Toutes les heures' },
  { value: 2, label: 'Tous les jours' },
  { value: 3, label: 'Toutes les semaines' },
  { value: 4, label: 'Tous les mois' }
];

watch(() => props.calendar, (cal) => {
  if (cal && props.mode === 'export') {
    exportUrl.value = `${window.location.origin}/api/calendar/${cal.id}/export.ics`;
  }
}, { immediate: true });

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'file';
    copied.value = false;
  }
});

const isDragging = ref(false);

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.name.endsWith('. ics')) {
      selectedFile.value = file;
      fileName.value = file.name;
    }
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
    fileName.value = input.files[0].name;
  }
};

// Validation
const isFormValid = computed(() => {
  if (props.mode === 'export') return true;

  if (activeTab.value === 'file') {
    return selectedFile.value !== null;
  } else {
    return icsUrl.value.trim() !== '' && isValidUrl(icsUrl.value);
  }
});

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.endsWith('.ics') || url.includes('calendar') || url.includes('ical');
  } catch {
    return false;
  }
};

// Copier l'URL dans le presse-papier
const copyToClipboard = () => {
  emit('submit', {
    mode: 'export',
    type: 'url',
    calendar: props.calendar,
  });

  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

// Télécharger le fichier ICS
const downloadICS = () => {
  emit('submit', {
    mode: 'export',
    type: 'file',
    calendar: props.calendar,
    appointments: props.appointments
  });
};

// Soumettre le formulaire
const handleSubmit = () => {
  if (props.mode === 'export') {
    if (activeTab.value === 'file') {
      downloadICS();
    } else {
      copyToClipboard();
    }
    return;
  }

  if (!isFormValid.value) return;
  const importData = {
    mode: 'import',
    type: activeTab.value,
    file: activeTab.value === 'file' ? selectedFile.value : null,
    url: activeTab.value === 'url' ? icsUrl.value : null,
    autoUpdate: activeTab.value === 'url' ? enableAutoUpdate.value : false,
    updateRule: enableAutoUpdate.value ? updateRule.value : null
  };

  emit('submit', importData);
};

const handleClose = () => {
  // Reset du formulaire
  activeTab.value = 'file';
  icsUrl.value = '';
  selectedFile.value = null;
  fileName.value = '';
  enableAutoUpdate.value = false;
  updateRule.value = 2;
  copied.value = false;
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>

    <!-- Modal -->
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <!-- Icône selon le mode -->
          <div :class="[
            'w-10 h-10 rounded-lg flex items-center justify-center',
            mode === 'import' ? 'bg-indigo-100' : 'bg-emerald-100'
          ]">
            <svg v-if="mode === 'import'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ config.title }}</h2>
            <p v-if="mode === 'export' && calendar" class="text-sm text-gray-500">
              {{ calendar.name }}
            </p>
          </div>
        </div>
        <button @click="handleClose"
          class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="px-6 pt-4">
        <div class="relative">
          <div class="grid grid-cols-2 text-sm font-semibold text-center">
            <button
              :class="activeTab === 'file' ? (mode === 'import' ? 'text-indigo-600' : 'text-emerald-600') : 'text-gray-500 hover:text-gray-700'"
              class="py-3 transition-colors duration-200 focus:outline-none flex items-center justify-center gap-2"
              @click="activeTab = 'file'">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              {{ config.fileTabLabel }}
            </button>
            <button
              :class="activeTab === 'url' ? (mode === 'import' ? 'text-indigo-600' : 'text-emerald-600') : 'text-gray-500 hover:text-gray-700'"
              class="py-3 transition-colors duration-200 focus:outline-none flex items-center justify-center gap-2"
              @click="activeTab = 'url'">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              {{ config.urlTabLabel }}
            </button>
          </div>
          <!-- Indicateur animé -->
          <span class="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 ease-out"
            :class="mode === 'import' ? 'bg-indigo-600' : 'bg-emerald-600'" :style="{
              width: '50%',
              transform: activeTab === 'url' ? 'translateX(100%)' : 'translateX(0)'
            }"></span>
        </div>
      </div>

      <!-- Contenu -->
      <div class="px-6 py-6">
        <!-- ==================== MODE IMPORT ==================== -->
        <template v-if="mode === 'import'">
          <!-- Tab Fichier - Import -->
          <div v-if="activeTab === 'file'">
            <div :class="[
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            ]" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
              <input type="file" accept=".ics" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="handleFileSelect" />

              <div v-if="!selectedFile">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                  :class="isDragging ? 'text-indigo-500' : 'text-gray-400'" class="mx-auto mb-4 transition-colors">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p class="text-gray-600 mb-1">
                  <span class="font-medium text-indigo-600">Cliquez pour sélectionner</span>
                  ou glissez-déposez
                </p>
                <p class="text-sm text-gray-400">Fichier . ics uniquement</p>
              </div>

              <div v-else class="flex items-center justify-center gap-3">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <polyline points="16 13 12 17 8 13"></polyline>
                    <line x1="12" y1="17" x2="12" y2="9"></line>
                  </svg>
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">{{ fileName }}</p>
                  <p class="text-sm text-gray-500">Fichier sélectionné</p>
                </div>
                <button @click. stop="clearFile"
                  class="ml-2 p-1. 5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Tab URL - Import -->
          <div v-else class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL du calendrier (. ics)
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="text-gray-400">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-. 54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </div>
                <input v-model="icsUrl" type="url" placeholder="https://example.com/calendar.ics"
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  :class="icsUrl && !isValidUrl(icsUrl) ? 'border-red-300 focus:ring-red-500' : ''" />
              </div>
              <p v-if="icsUrl && !isValidUrl(icsUrl)" class="mt-1. 5 text-sm text-red-500">
                Veuillez entrer une URL valide de calendrier
              </p>
            </div>

            <!-- Option de mise à jour automatique (Import URL uniquement) -->
            <div class="bg-gray-50 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <div class="flex items-center h-6">
                  <input id="auto-update" v-model="enableAutoUpdate" type="checkbox"
                    class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </div>
                <div class="flex-1">
                  <label for="auto-update" class="text-sm font-medium text-gray-900 cursor-pointer">
                    Mettre à jour automatiquement
                  </label>
                  <p class="text-xs text-gray-500 mt-0.5">
                    Le calendrier sera synchronisé périodiquement avec la source
                  </p>
                </div>
              </div>

              <div v-if="enableAutoUpdate" class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex items-center gap-3">
                  <label class="text-sm text-gray-700 whitespace-nowrap">
                    Mettre à jour :
                  </label>
                  <select v-model="updateRule"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm transition-all cursor-pointer">
                    <option v-for="option in updateRuleOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== MODE EXPORT ==================== -->
        <template v-else>
          <!-- Tab Fichier - Export -->
          <div v-if="activeTab === 'file'">
            <div class="text-center py-6">
              <div class="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                Télécharger le fichier . ics
              </h3>
              <p class="text-sm text-gray-500 mb-6">
                Le fichier contiendra tous les rendez-vous du calendrier
                <span v-if="calendar" class="font-medium text-gray-700">« {{ calendar.name }} »</span>
              </p>
              <div class="bg-gray-50 rounded-xl p-4 text-left">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">
                      {{ calendar?.name || 'Calendrier' }}. ics
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ appointments.length }} rendez-vous
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab URL - Export -->
          <div v-else class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Lien de partage du calendrier
              </label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      class="text-gray-400">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <input @click="copyToClipboard" value="Cliquez ici pour générer et copier le lien sécurisé"
                    type="text" readonly
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 text-sm italic cursor-pointer hover:bg-gray-100 transition-colors" />
                </div>
                <button @click="copyToClipboard" :class="[
                  'px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                ]">
                  <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {{ copied ? 'Copié !' : 'Copier' }}
                </button>
              </div>
            </div>

            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div class="flex gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12. 01" y2="16"></line>
                </svg>
                <div>
                  <p class="text-sm font-medium text-amber-800">Lien permanent</p>
                  <p class="text-xs text-amber-700 mt-1">
                    Ce lien permet à d'autres applications de s'abonner à votre calendrier.
                    Les mises à jour seront automatiquement synchronisées.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
        <button @click="handleClose"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          {{ mode === 'export' && activeTab === 'url' ? 'Fermer' : 'Annuler' }}
        </button>
        <button v-if="!(mode === 'export' && activeTab === 'url')" @click="handleSubmit" :disabled="!isFormValid"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
            isFormValid
              ? (mode === 'import'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700')
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]">
          <svg v-if="mode === 'import'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {{ config.submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>