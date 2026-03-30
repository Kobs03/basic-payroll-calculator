<template>
  <div class="min-h-screen bg-slate-200 p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <!-- Left div: Inputs -->
      <div class="bg-slate-500 text-white p-6 rounded-xl shadow space-y-4">
        <h2 class="font-bold text-lg">Pay Calculator</h2>

        <!-- Base Salary -->
        <div>
          <label class="block mb-1">Base Salary (Monthly):</label>
          <input type="number" v-model.number="baseSalary" class="p-2 rounded text-black w-full" />
        </div>

        <!-- Start Time -->
        <div>
          <label class="block mb-1">Start Time:</label>
          <input type="time" v-model="startTime" class="p-2 rounded text-black w-full" />
        </div>

        <!-- End Time -->
        <div>
          <label class="block mb-1">End Time:</label>
          <input type="time" v-model="endTime" class="p-2 rounded text-black w-full" />
        </div>

        <!-- Day Type -->
        <div>
          <label class="block mb-1">Day Type:</label>
          <select v-model="dayType" class="p-2 rounded text-black w-full">
            <option value="regularDay">Regular Day</option>
            <option value="restDay">Rest Day</option>
            <option value="specialHoliday">Special Holiday</option>
            <option value="regularHoliday">Regular Holiday</option>
            <option value="restDayPlusRegularHoliday">Rest + Regular Holiday</option>
            <option value="restDayPlusSpecialHoliday">Rest + Special Holiday</option>
          </select>
        </div>

        <hr>

        <!-- Multipliers Reference Table -->
        <div class="mt-6 bg-slate-600 p-4 rounded">
          <h3 class="font-bold mb-2">Multipliers Reference</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-white border-collapse">
              <thead>
                <tr>
                  <th class="border px-2 py-1 text-left">Day Type</th>
                  <th class="border px-2 py-1">Base</th>
                  <th class="border px-2 py-1">Overtime</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(base, key) in BASE_MULTIPLIERS" :key="key"
                  :class="key === dayType ? 'bg-yellow-400 bg-opacity-30' : ''">
                  <td class="border px-2 py-1 capitalize">{{ key.replace(/([A-Z])/g, ' $1') }}</td>
                  <td class="border px-2 py-1">{{ base }} ({{ (base * 100).toFixed(0) }}%)</td>
                  <td class="border px-2 py-1">
                    {{ OVERTIME_MULTIPLIERS[key].toFixed(2) }} ({{ (OVERTIME_MULTIPLIERS[key] * 100).toFixed(0) }}%)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right div: Pay Breakdown -->
      <div class="bg-slate-700 text-white p-6 rounded-xl shadow space-y-4">
        <h2 class="font-bold text-lg mb-2">Pay Breakdown</h2>

        <div class="bg-slate-600 p-3 rounded space-y-1">
          <p>Monthly Base Salary: <strong>{{ baseSalary }}</strong></p>
          <p>Daily Rate: <strong>{{ dailyRate.toFixed(2) }}</strong></p>
          <p>Hourly Rate: <strong>{{ hourlyRate.toFixed(2) }}</strong></p>
          <p>Per Minute Rate: <strong>{{ perMinuteRate.toFixed(2) }}</strong></p>
          <div class="bg-slate-700 p-3 rounded space-y-1">
            <p>Total Minutes Worked: <strong class="text-gray-200">{{ totalMinutesWorked }}</strong></p>
            <p>Base Minutes: <strong class="text-blue-400">{{ baseMinutes }}</strong></p>
            <p>Overtime Minutes: <strong class="text-orange-400">{{ otMinutes }}</strong></p>
          </div>
        </div>

        <!-- Base Pay -->
        <div class="bg-blue-600 p-3 rounded text-white">
          <p>Base Pay: <strong>{{ basePay.toFixed(2) }}</strong></p>
        </div>

        <!-- Overtime Pay -->
        <div class="bg-orange-600 p-3 rounded text-white">
          <p>Overtime Pay: <strong>{{ otPay.toFixed(2) }}</strong></p>
        </div>

        <!-- Total Pay -->
        <div class="bg-green-600 p-3 rounded font-bold text-lg text-white">
          Total Pay: <strong>{{ totalPay.toFixed(2) }}</strong>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Multipliers
const BASE_MULTIPLIERS = {
  regularDay: 1,
  restDay: 1.3,
  specialHoliday: 1.3,
  regularHoliday: 2,
  restDayPlusRegularHoliday: 2.6,
  restDayPlusSpecialHoliday: 1.5
}

const OVERTIME_MULTIPLIERS = {
  regularDay: 1.25,
  restDay: 1.3 * 1.3,
  specialHoliday: 1.3 * 1.3,
  regularHoliday: 2 * 1.3,
  restDayPlusRegularHoliday: 2.6 * 1.3,
  restDayPlusSpecialHoliday: 1.5 * 1.3
}

// Inputs
const baseSalary = ref(15000)
const dayType = ref('regularDay')

// Time inputs
const startTime = ref('08:30')
const endTime = ref('17:30')

// Compute total minutes worked (subtract 60 minutes break)
const totalMinutesWorked = computed(() => {
  if (!startTime.value || !endTime.value) return 0
  const [startH, startM] = startTime.value.split(':').map(Number)
  const [endH, endM] = endTime.value.split(':').map(Number)
  let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM)
  if (diffMinutes < 0) diffMinutes += 24 * 60
  return Math.max(diffMinutes - 60, 0) // subtract 1 hour break
})

// Base and OT minutes
const baseMinutes = computed(() => Math.min(totalMinutesWorked.value, 480)) // 8 hours = 480 min
const otMinutes = computed(() => Math.max(totalMinutesWorked.value - 480, 0))

// Computed rates
const dailyRate = computed(() => (baseSalary.value * 12) / 365)
const hourlyRate = computed(() => dailyRate.value / 8)
const perMinuteRate = computed(() => hourlyRate.value / 60)

const basePay = computed(() => baseMinutes.value * perMinuteRate.value * BASE_MULTIPLIERS[dayType.value])
const otPay = computed(() => otMinutes.value * perMinuteRate.value * OVERTIME_MULTIPLIERS[dayType.value])
const totalPay = computed(() => basePay.value + otPay.value)
</script>