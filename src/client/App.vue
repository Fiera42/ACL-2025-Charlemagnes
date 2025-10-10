<template>
  <CalendarWeekView
      :currentView="currentView"
      :events="events"
      @changeView="currentView = $event"
      @newEvent="createEvent"
  />
</template>

<script setup>
import { ref } from 'vue'
import CalendarWeekView from '../components/CalendarWeekView.vue'

const currentView = ref('Week')
const events = ref([
  { title: 'Pickup grandmother', date: new Date().toDateString(), hour: '07:00', colorClass: 'border-purple-600 bg-purple-50', textColor: 'text-purple-600', time: '06:00 - 07:30' },
  { title: 'Meeting with PM', date: new Date().toDateString(), hour: '11:00', colorClass: 'border-blue-600 bg-blue-50', textColor: 'text-blue-600', time: '11:00 - 12:30' }
])

function createEvent() {
  alert('Créer un nouvel événement !')
}
</script>
