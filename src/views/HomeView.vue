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

        <hr class="my-2">

        <!-- Multipliers Reference Table -->
        <div class="mt-6 bg-slate-600 p-4 rounded">
          <h3 class="font-bold mb-2">Multipliers Reference (Click to select)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-white border-collapse text-sm">

              <thead>
                <tr>
                  <th class="border px-2 py-1 text-left">Day Type</th>
                  <th class="border px-2 py-1">Base</th>
                  <th class="border px-2 py-1">Overtime</th>
                  <th class="border px-2 py-1">Formula / Explanation</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(base, key) in BASE_MULTIPLIERS" :key="key" @click="dayType = key" :class="[
                  key === dayType ? 'bg-yellow-400 bg-opacity-30' : '',
                  'hover:bg-yellow-300 hover:bg-opacity-20 cursor-pointer'
                ]">
                  <td class="border px-2 py-1 capitalize">
                    {{ key.replace(/([A-Z])/g, ' $1') }}
                  </td>
                  <td class="border px-2 py-1">
                    {{ base.toFixed(2) }} ({{ (base * 100).toFixed(0) }}%)
                  </td>
                  <td class="border px-2 py-1">
                    {{ OVERTIME_MULTIPLIERS[key].toFixed(2) }} ({{ (OVERTIME_MULTIPLIERS[key] * 100).toFixed(0) }}%)
                  </td>
                  <td class="border px-2 py-1 text-xs leading-tight space-y-1">
                    <div>
                      <strong>Base:</strong> rate × {{ base.toFixed(2) }} = {{ (base * 100).toFixed(0) }}%
                    </div>
                    <div>
                      <strong>OT:</strong> rate × {{ OVERTIME_MULTIPLIERS[key].toFixed(2) }} = {{
                        (OVERTIME_MULTIPLIERS[key] * 100).toFixed(0) }}%
                    </div>
                    <div class="text-purple-300"><strong>Night Diff:</strong> +10% (rate × 0.10)</div>
                    <div v-if="key.includes('restDay') || key.includes('holiday')" class="text-gray-300 text-[0.7rem]">
                      <em>Computed: {{ base.toFixed(2) }} × 1.3 = {{ OVERTIME_MULTIPLIERS[key].toFixed(2) }}</em>
                    </div>
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
          <p>Per Minute Rate: <strong>{{ perMinuteRate.toFixed(4) }}</strong></p>

          <div class="bg-slate-700 p-3 rounded space-y-1">
            <p>Total Minutes Worked: <strong class="text-gray-200">{{ totalMinutesWorked }}</strong></p>
            <p>Total Hours Worked: <strong class="text-gray-200">{{ totalHoursWorked }}</strong></p>

            <p>Base Minutes: <strong class="text-blue-400">{{ baseMinutes }}</strong></p>
            <p>Base Hours: <strong class="text-blue-400">{{ baseHours }}</strong></p>

            <p>Overtime Minutes: <strong class="text-orange-400">{{ otMinutes }}</strong></p>
            <p>Overtime Hours: <strong class="text-orange-400">{{ otHours }}</strong></p>

            <p>Night Minutes: <strong class="text-purple-400">{{ nightMinutes }}</strong></p>
            <p>Night Hours: <strong class="text-purple-400">{{ nightHours }}</strong></p>
          </div>
        </div>

        <div class="bg-blue-600 p-3 rounded text-white">
          <p>Base Pay: <strong>{{ basePay.toFixed(2) }}</strong></p>
        </div>
        <div class="bg-orange-600 p-3 rounded text-white">
          <p>Overtime Pay: <strong>{{ otPay.toFixed(2) }}</strong></p>
        </div>
        <div class="bg-purple-600 p-3 rounded text-white">
          <p>Night Diff Pay: <strong>{{ nightDiffPay.toFixed(2) }}</strong></p>
        </div>
        <div class="bg-green-600 p-3 rounded font-bold text-lg text-white">
          <p>Total Pay: <strong>{{ totalPay.toFixed(2) }}</strong></p>
        </div>

        <!-- Button to open calculator modal -->
        <button @click="showCalculator = true" class="bg-gray-800 p-3 rounded w-full hover:bg-gray-700">
          Open Calculator
        </button>
      </div>

    </div>

    <!-- Calculator Modal -->
    <transition name="fade">
      <div v-if="showCalculator" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-gray-900 p-6 rounded-xl w-80 relative">
          <h3 class="font-bold text-white text-lg mb-2">Calculator</h3>
          <button @click="showCalculator = false" class="absolute top-2 right-2 text-red-500 font-bold">✕</button>

          <input type="text" v-model="calcInput" class="p-2 rounded w-full text-black mb-2" placeholder="0"
            @keyup.enter="press('=')" />

          <div class="grid grid-cols-4 gap-2">
            <button v-for="btn in buttons" :key="btn" @click="press(btn)"
              class="bg-gray-700 p-2 rounded hover:bg-gray-600 text-white">{{ btn }}</button>
          </div>

          <button @click="clearCalc"
            class="bg-red-600 p-2 rounded w-full mt-2 hover:bg-red-500 text-white">Clear</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// --- PAY CALCULATOR ---
const BASE_MULTIPLIERS = {
  regularDay: 1, restDay: 1.3, specialHoliday: 1.3,
  regularHoliday: 2, restDayPlusRegularHoliday: 2.6, restDayPlusSpecialHoliday: 1.5
}
const OVERTIME_MULTIPLIERS = {
  regularDay: 1.25, restDay: 1.3 * 1.3, specialHoliday: 1.3 * 1.3,
  regularHoliday: 2 * 1.3, restDayPlusRegularHoliday: 2.6 * 1.3, restDayPlusSpecialHoliday: 1.5 * 1.3
}
const NIGHT_DIFF = 0.10

const baseSalary = ref(15000)
const dayType = ref('regularDay')
const startTime = ref('08:30')
const endTime = ref('17:30')

// Timeline
const toMinutes = (time) => time.split(':').map(Number).reduce((h, m) => h * 60 + m)
const timeline = computed(() => {
  if (!startTime.value || !endTime.value) return []
  let start = toMinutes(startTime.value)
  let end = toMinutes(endTime.value)
  if (end < start) end += 1440
  const arr = []
  for (let t = start; t < end; t++) { const mod = t % 1440; arr.push({ isNight: mod >= 1320 || mod < 360 }) }
  return arr.slice(60)
})

// Totals
const totalMinutesWorked = computed(() => timeline.value.length)
const formatHM = mins => `${Math.floor(mins / 60)}h ${mins % 60}m`
const totalHoursWorked = computed(() => formatHM(totalMinutesWorked.value))
const baseMinutes = computed(() => Math.min(totalMinutesWorked.value, 480))
const otMinutes = computed(() => Math.max(totalMinutesWorked.value - 480, 0))
const baseHours = computed(() => formatHM(baseMinutes.value))
const otHours = computed(() => formatHM(otMinutes.value))
const nightMinutes = computed(() => timeline.value.filter(m => m.isNight).length)
const nightHours = computed(() => formatHM(nightMinutes.value))
const dailyRate = computed(() => baseSalary.value * 12 / 365)
const hourlyRate = computed(() => dailyRate.value / 8)
const perMinuteRate = computed(() => hourlyRate.value / 60)
const basePay = computed(() => baseMinutes.value * perMinuteRate.value * BASE_MULTIPLIERS[dayType.value])
const otPay = computed(() => otMinutes.value * perMinuteRate.value * OVERTIME_MULTIPLIERS[dayType.value])
const nightDiffPay = computed(() => nightMinutes.value * perMinuteRate.value * NIGHT_DIFF)
const totalPay = computed(() => basePay.value + otPay.value + nightDiffPay.value)

// --- CALCULATOR MODAL ---
const showCalculator = ref(false)
const calcInput = ref('')
const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+']
const press = btn => {
  if (btn === '=') { try { calcInput.value = String(eval(calcInput.value)) } catch (e) { calcInput.value = 'Error' } }
  else calcInput.value += btn
}
const clearCalc = () => calcInput.value = ''
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0
}
</style>