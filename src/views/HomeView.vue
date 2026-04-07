<template>
  <div class="min-h-screen bg-slate-200 p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <!-- Left div: Inputs -->
      <div class="bg-slate-800 text-white p-5 rounded-2xl shadow-lg space-y-5 border border-slate-700">

        <h2 class="font-extrabold text-lg text-center text-white">Pay Calculator</h2>

        <!-- Base Salary -->
        <div class="flex flex-col space-y-1">
          <label class="text-sm font-semibold">Base Salary (Monthly)</label>
          <input type="number" v-model.number="baseSalary"
            class="p-2 rounded-md border border-slate-600 w-full bg-slate-700 focus:ring-2 focus:ring-primary focus:outline-none" />
        </div>

        <!-- Start & End Time -->
        <div class="flex gap-3">
          <div class="flex-1 flex flex-col space-y-1">
            <label class="text-sm font-semibold">Duty Start Time</label>
            <input type="time" v-model="startTime"
              class="p-2 rounded-md border border-slate-600 w-full bg-slate-700 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <div class="flex-1 flex flex-col space-y-1">
            <label class="text-sm font-semibold">Duty End Time</label>
            <input type="time" v-model="endTime"
              class="p-2 rounded-md border border-slate-600 w-full bg-slate-700 focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        </div>

        <hr class="border-slate-700 my-3">

        <!-- Multipliers Reference Cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="(base, key) in BASE_MULTIPLIERS" :key="key" @click="dayType = key" :class="[
            key === dayType ? 'bg-blue-800 ring-2 ring-blue-500' : 'bg-slate-700 hover:bg-blue-700 hover:bg-opacity-50',
            'p-4 rounded-xl cursor-pointer transition-all shadow-lg flex flex-col justify-between'
          ]">

            <!-- Day Type -->
            <div class="text-white font-bold capitalize text-lg mb-2">
              {{ key.replace(/([A-Z])/g, ' $1') }}
            </div>

            <!-- Multipliers Section -->
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div class="text-gray-300">Base</div>
              <div class="col-span-2 text-white font-semibold text-right">
                {{ base.toFixed(2) }} ({{ (base * 100).toFixed(0) }}%)
              </div>

              <div class="text-gray-300">OT</div>
              <div class="col-span-2 text-white font-semibold text-right">
                {{ OVERTIME_MULTIPLIERS[key].toFixed(2) }} ({{ (OVERTIME_MULTIPLIERS[key] * 100).toFixed(0) }}%)
              </div>

              <div class="text-gray-300">Night Diff</div>
              <div class="col-span-2 text-purple-300 font-semibold text-right">+10%</div>
            </div>
          </div>
        </div>

        <!-- Notes / Formulas Outside the Cards -->
        <div class="mt-4 p-4 bg-slate-700 rounded-xl text-gray-300 text-sm space-y-1 shadow-inner">
          <div><strong>Base Formula:</strong> <b>Regular day</b> per-hour/per-minute × base multiplier</div>
          <div><strong>OT Formula:</strong> <b>Regular day</b> per-hour/per-minute × OT multiplier</div>
          <div class="text-purple-300"><strong>Night Diff Formula:</strong> per-minute × {{ NIGHT_DIFF }} (applied to
            base & OT minutes during night hours)</div>
          <div class="italic" v-if="BASE_MULTIPLIERS['restDay'] || BASE_MULTIPLIERS['holiday']">
            For rest days / holidays: base × 1.3 = OT multiplier (applied where applicable)
          </div>
        </div>
      </div>

      <!-- Right div: Pay Breakdown -->
      <div class="bg-slate-800 text-white p-6 rounded-2xl shadow-lg space-y-6">

        <h2 class="font-extrabold text-2xl mb-4 text-center">Pay Breakdown</h2>

        <!-- Rates Section -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-700 p-4 rounded-lg text-center shadow-inner">
            <p class="text-sm text-gray-300">Daily Rate</p>
            <p class="font-bold text-lg">{{ dailyRate.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-700 p-4 rounded-lg text-center shadow-inner">
            <p class="text-sm text-gray-300">Hourly Rate</p>
            <p class="font-bold text-lg">{{ hourlyRate.toFixed(2) }}</p>
          </div>
          <div class="bg-slate-700 p-4 rounded-lg text-center shadow-inner">
            <p class="text-sm text-gray-300">Per Minute Rate</p>
            <p class="font-bold text-lg">{{ perMinuteRate.toFixed(4) }}</p>
          </div>
          <div class="bg-slate-700 p-4 rounded-lg text-center shadow-inner">
            <p class="text-sm text-gray-300">OT Hourly Rate</p>
            <p class="font-bold text-lg">{{ otHourlyRate.toFixed(2) }}</p>
            <p class="text-sm text-gray-400">OT/Min: {{ otPerMinuteRate.toFixed(4) }}</p>
          </div>
        </div>

        <!-- Worked Time Section -->
        <div class="bg-slate-700 p-4 rounded-lg shadow-inner space-y-2">
          <h3 class="font-semibold text-lg mb-2 text-center">Worked Time</h3>
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4 text-center">
            <div>
              <p class="text-gray-300 text-sm">Total Minutes</p>
              <p class="font-bold">{{ totalMinutesWorked }}</p>
            </div>
            <div>
              <p class="text-gray-300 text-sm">Total Hours</p>
              <p class="font-bold">{{ totalHoursWorked }}</p>
            </div>
            <div>
              <p class="text-blue-400 text-sm">Base Minutes</p>
              <p class="font-bold">{{ baseMinutes }}</p>
            </div>
            <div>
              <p class="text-blue-400 text-sm">Base Hours</p>
              <p class="font-bold">{{ baseHours }}</p>
            </div>
            <div>
              <p class="text-orange-400 text-sm">OT Minutes</p>
              <p class="font-bold">{{ otMinutes }}</p>
            </div>
            <div>
              <p class="text-orange-400 text-sm">OT Hours</p>
              <p class="font-bold">{{ otHours }}</p>
            </div>
            <div>
              <p class="text-purple-400 text-sm">Night Minutes</p>
              <p class="font-bold">{{ nightMinutes }}</p>
            </div>
            <div>
              <p class="text-purple-400 text-sm">Night Hours</p>
              <p class="font-bold">{{ nightHours }}</p>
            </div>
          </div>
        </div>

        <!-- Pay Summary Section -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-600 p-4 rounded-lg text-center shadow-md">
            <p class="text-sm">Base Pay</p>
            <p class="font-bold text-lg">{{ basePay.toFixed(2) }}</p>
          </div>
          <div class="bg-orange-600 p-4 rounded-lg text-center shadow-md">
            <p class="text-sm">Overtime Pay</p>
            <p class="font-bold text-lg">{{ otPay.toFixed(2) }}</p>
          </div>
          <div class="bg-purple-600 p-4 rounded-lg text-center shadow-md">
            <p class="text-sm">Night Diff Pay</p>
            <p class="font-bold text-lg">{{ nightDiffPay.toFixed(2) }}</p>
          </div>
          <div class="bg-green-600 p-4 rounded-lg text-center shadow-md">
            <p class="text-sm">Total Pay</p>
            <p class="font-extrabold text-xl">{{ totalPay.toFixed(2) }}</p>
          </div>
        </div>

        <!-- Open Calculator Button -->
        <button @click="showCalculator = true"
          class="bg-gray-900 hover:bg-gray-800 w-full p-3 rounded-xl font-semibold text-white transition-all duration-200">
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

// --- TIMELINE ---
const toMinutes = (time) => time.split(':').map(Number).reduce((h, m) => h * 60 + m)

const timeline = computed(() => {
  if (!startTime.value || !endTime.value) return []
  let start = toMinutes(startTime.value)
  let end = toMinutes(endTime.value)
  if (end < start) end += 1440
  const arr = []
  for (let t = start; t < end; t++) {
    const mod = t % 1440
    arr.push({ isNight: mod >= 1320 || mod < 360 })
  }
  // Deduct 1 hour if total >= 9h
  if (arr.length >= 540) arr.splice(0, 60)
  return arr
})

// --- TOTALS ---
const formatHM = mins => `${Math.floor(mins / 60)}h ${mins % 60}m`

const totalMinutesWorked = computed(() => timeline.value.length)
const totalHoursWorked = computed(() => formatHM(totalMinutesWorked.value))
const baseMinutes = computed(() => Math.min(totalMinutesWorked.value, 480))
const otMinutes = computed(() => Math.max(totalMinutesWorked.value - 480, 0))
const baseHours = computed(() => formatHM(baseMinutes.value))
const otHours = computed(() => formatHM(otMinutes.value))
const nightMinutes = computed(() => timeline.value.filter(m => m.isNight).length)
const nightHours = computed(() => formatHM(nightMinutes.value))

// --- RATES ---
const dailyRate = computed(() => baseSalary.value * 12 / 365)
const hourlyRate = computed(() => dailyRate.value * BASE_MULTIPLIERS[dayType.value] / 8)
const perMinuteRate = computed(() => hourlyRate.value / 60)

// OT rates
const otHourlyRate = computed(() => hourlyRate.value * (OVERTIME_MULTIPLIERS[dayType.value] / BASE_MULTIPLIERS[dayType.value]))
const otPerMinuteRate = computed(() => otHourlyRate.value / 60)

// --- PAY ---
const basePay = computed(() => baseMinutes.value * perMinuteRate.value)
const otPay = computed(() => otMinutes.value * otPerMinuteRate.value)
const nightDiffPay = computed(() => {
  let total = 0
  timeline.value.forEach((m, index) => {
    if (!m.isNight) return
    // minutes after 480 are OT
    const rate = index < 480 ? perMinuteRate.value : otPerMinuteRate.value
    total += rate * NIGHT_DIFF
  })
  return total
})
const totalPay = computed(() => basePay.value + otPay.value + nightDiffPay.value)

// --- CALCULATOR ---
const showCalculator = ref(false)
const calcInput = ref('')
const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+']
const press = btn => {
  if (btn === '=') {
    try { calcInput.value = String(eval(calcInput.value)) }
    catch (e) { calcInput.value = 'Error' }
  } else calcInput.value += btn
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