<template>
    <div class="min-h-screen bg-slate-50 p-8">
        <h1 class="text-3xl font-bold mb-6 text-slate-700">🕒 DTR Viewer</h1>

        <div class="flex flex-col lg:flex-row gap-8">
            <!-- Left: Inputs & Employee Selector -->
            <div class="lg:w-1/3 bg-white p-6 rounded-2xl shadow-md space-y-4">
                <h2 class="text-lg font-semibold text-slate-600 mb-2">Select Employee & Schedule</h2>

                <div>
                    <label class="block font-medium text-slate-600 mb-1">Employee</label>
                    <select v-model="selectedEmployeeId"
                        class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400">
                        <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
                    </select>
                </div>

                <div>
                    <label class="block font-medium text-slate-600 mb-1">Shift Start</label>
                    <input v-model="currentEmployee.shiftStart" type="time"
                        class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label class="block font-medium text-slate-600 mb-1">Shift End</label>
                    <input v-model="currentEmployee.shiftEnd" type="time"
                        class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" />
                </div>

                <hr />

                <div>
                    <label class="block font-medium text-slate-600 mb-1">Add Biometric Time</label>
                    <input v-model="biometricTime" type="time"
                        class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" />
                </div>

                <button @click="addBiometricLog"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition-colors duration-200">
                    Add Log
                </button>
            </div>

            <!-- Right: Logs -->
            <div class="lg:w-2/3 flex flex-col lg:flex-row gap-6 h-[500px]">
                <!-- Clean Logs -->
                <div class="bg-white rounded-2xl shadow-md p-6 flex flex-col flex-1 overflow-y-auto">
                    <h2 class="text-xl font-semibold text-slate-700 mb-4">✅ Clean Logs</h2>
                    <div class="space-y-3 text-slate-700 flex-1">
                        <div v-for="log in getCleanLogTemplate(currentEmployee)" :key="log.label"
                            class="flex justify-between">
                            <span class="font-medium text-slate-700 w-44">{{ log.label }}</span>
                            <span class="font-bold text-slate-900">{{ log.time || '-' }}</span>
                        </div>
                    </div>
                </div>

                <!-- Raw Logs -->
                <div class="flex-1 bg-white rounded-2xl shadow-md p-6 flex flex-col overflow-y-auto">
                    <h2 class="text-xl font-semibold text-slate-700 mb-4">📋 Raw Logs</h2>

                    <div v-if="currentEmployee.rawLogs.length" class="flex-1 overflow-y-auto">
                        <div class="space-y-2">
                            <div v-for="(log, i) in currentEmployee.rawLogs" :key="i"
                                class="flex justify-between items-center border-b border-slate-200 pb-2"
                                :class="log.status === 'disregarded' ? 'text-slate-400 italic' : 'text-slate-700'">
                                <span class="font-medium">{{ log.type }} {{ format(log.timestamp) }} ({{ log.status
                                }})</span>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-slate-400 italic flex-1 flex items-center justify-center">
                        No logs yet. Add a biometric time to start.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue"

const biometricTime = ref("08:30")

const employees = ref([
    { id: 1, name: "John Doe", shiftStart: "08:00", shiftEnd: "17:00", rawLogs: [], cleanLogs: [], daySummary: {} },
    { id: 2, name: "Jane Smith", shiftStart: "09:00", shiftEnd: "18:00", rawLogs: [], cleanLogs: [], daySummary: {} }
])

const selectedEmployeeId = ref(employees.value[0].id)
const currentEmployee = computed(() => employees.value.find(emp => emp.id === selectedEmployeeId.value))

// --- Add Biometric Log ---
function addBiometricLog() {
    const emp = currentEmployee.value
    if (!emp) return

    const timestamp = combineWithToday(biometricTime.value)

    // Determine type based on last log
    const lastLog = [...emp.rawLogs].reverse().find(() => true)
    let type = "IN"
    if (lastLog) type = lastLog.type === "IN" ? "OUT" : "IN"

    // Determine status
    let status = "logged"

    // Check previous logged entries of same type within 1 min
    const lastLoggedSameType = [...emp.rawLogs]
        .reverse()
        .find(l => l.type === type && l.status === "logged")
    if (lastLoggedSameType) {
        const diffMs = Math.abs(timestamp - new Date(lastLoggedSameType.timestamp))
        if (diffMs < 60 * 1000) status = "disregarded"
    }

    emp.rawLogs.push({ timestamp, type, status })
    recomputeCleanLogs(emp)
}

// --- Helpers ---
function combineWithToday(time) {
    const [h, m] = time.split(":")
    const date = new Date()
    date.setHours(Number(h), Number(m), 0, 0)
    return date
}

function format(date) {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// =========================
// Main DTR computation
// =========================
function recomputeCleanLogs(emp) {
    const today = new Date()
    const logs = emp.rawLogs
        .filter(l => {
            const ts = new Date(l.timestamp)
            return ts.getFullYear() === today.getFullYear() &&
                ts.getMonth() === today.getMonth() &&
                ts.getDate() === today.getDate() &&
                l.status === "logged"
        })
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    emp.cleanLogs.splice(0)
    if (!logs.length) return

    const [shiftHStart, shiftMStart] = emp.shiftStart.split(":").map(Number)
    const [shiftHEnd, shiftMEnd] = emp.shiftEnd.split(":").map(Number)
    const shiftStartDate = new Date(); shiftStartDate.setHours(shiftHStart, shiftMStart, 0, 0)
    const shiftEndDate = new Date(); shiftEndDate.setHours(shiftHEnd, shiftMEnd, 0, 0)

    const firstIn = logs.find(l => l.type === "IN")
    const lastOut = [...logs].reverse().find(l => l.type === "OUT")
    const firstInTs = firstIn ? new Date(firstIn.timestamp) : null
    const lastOutTs = lastOut ? new Date(lastOut.timestamp) : null

    // --- Lunch calculation (ignore early INs) ---
    const minLunchDelay = 60 * 60 * 1000
    const lunchOut = logs.find(l => l.type === "OUT" && firstInTs && (new Date(l.timestamp) - firstInTs >= minLunchDelay))
    const lunchIn = lunchOut ? new Date(lunchOut.timestamp.getTime() + 60 * 60 * 1000) : null // fixed 1 hour lunch
    const realLunchOut = lunchOut
    const realLunchIn = lunchIn ? { timestamp: lunchIn } : null

    // --- Time In ---
    let timeInLabel = firstInTs ? format(firstInTs) : "-"
    const lateMins = firstInTs && firstInTs > shiftStartDate
        ? Math.floor((firstInTs - shiftStartDate) / 60000)
        : 0
    if (lateMins) timeInLabel += " (Late)"
    emp.cleanLogs.push({ label: "Time In", time: timeInLabel })

    // --- Lunch ---
    emp.cleanLogs.push({ label: "Lunch Out", time: realLunchOut ? format(realLunchOut.timestamp) : '-' })
    emp.cleanLogs.push({ label: "Lunch In", time: realLunchIn ? format(realLunchIn.timestamp) : '-' })

    // --- Time Out ---
    let undertimeMins = lastOutTs && lastOutTs < shiftEndDate
        ? Math.floor((shiftEndDate - lastOutTs) / 60000)
        : 0
    undertimeMins = Math.max(0, undertimeMins - 60)
    let timeOutLabel = lastOutTs ? format(lastOutTs) : '-'
    if (undertimeMins && lastOutTs) timeOutLabel += " (Undertime)"
    emp.cleanLogs.push({ label: "Time Out", time: timeOutLabel })

    // --- Penalized ---
    const penalizedTotal = lateMins + (lastOutTs ? undertimeMins : 0)
    const status = lastOutTs && lastOutTs >= shiftEndDate ? "Complete" : "Incomplete"
    emp.cleanLogs.push({ label: "Status", time: status })
    emp.cleanLogs.push({ label: "Total Late Time", time: `${lateMins} mins` })
    emp.cleanLogs.push({ label: "Total Undertime", time: lastOutTs ? `${undertimeMins} mins` : '0 mins' })
    emp.cleanLogs.push({ label: "Penalized Total", time: `${penalizedTotal} mins` })

    // --- Base Duty Hours (ignore early lunch in) ---
    let baseDutyMs = 0
    if (firstInTs && lastOutTs) {
        const morningEnd = realLunchOut ? new Date(realLunchOut.timestamp) : lastOutTs
        const morningMs = Math.max(0, morningEnd - shiftStartDate)

        const afternoonStart = realLunchIn ? new Date(realLunchIn.timestamp) : null
        const afternoonEnd = lastOutTs
        const afternoonMs = afternoonStart ? Math.max(0, afternoonEnd - afternoonStart) : 0

        baseDutyMs = morningMs + afternoonMs

        const shiftTotalMs = shiftEndDate - shiftStartDate
        const maxBaseMs = shiftTotalMs - 60 * 60 * 1000 // 1 hour lunch
        baseDutyMs = Math.min(baseDutyMs, maxBaseMs)

        const lateMs = firstInTs > shiftStartDate ? firstInTs - shiftStartDate : 0
        baseDutyMs = Math.max(0, baseDutyMs - lateMs)
    }

    const baseHours = Math.floor(baseDutyMs / 3600000)
    const baseMinutes = Math.floor((baseDutyMs % 3600000) / 60000)
    emp.cleanLogs.push({ label: "Base Duty Hours", time: `${baseHours} hr ${baseMinutes} min` })

    // --- Overtime ---
    let overtimeMs = 0
    if (lastOutTs && lastOutTs > shiftEndDate) {
        overtimeMs = lastOutTs - shiftEndDate
    }
    const otHours = Math.floor(overtimeMs / 3600000)
    const otMinutes = Math.floor((overtimeMs % 3600000) / 60000)
    emp.cleanLogs.push({ label: "Overtime Hours", time: `${otHours} hr ${otMinutes} min` })

    // --- Total Duty ---
    const totalDutyMs = baseDutyMs + overtimeMs
    const totalHours = Math.floor(totalDutyMs / 3600000)
    const totalMinutes = Math.floor((totalDutyMs % 3600000) / 60000)
    emp.cleanLogs.push({ label: "Total Duty Hours", time: `${totalHours} hr ${totalMinutes} min` })
}

// Always show all labels
function getCleanLogTemplate(emp) {
    if (!emp) return []
    const defaultLogs = [
        { label: 'Time In', time: '' },
        { label: 'Lunch Out', time: '' },
        { label: 'Lunch In', time: '' },
        { label: 'Time Out', time: '' },
        { label: 'Status', time: '' },
        { label: 'Total Late Time', time: '' },
        { label: 'Total Undertime', time: '' },
        { label: 'Penalized Total', time: '' },
        { label: 'Base Duty Hours', time: '' },
        { label: 'Overtime Hours', time: '' },
        { label: 'Total Duty Hours', time: '' }
    ]

    if (!emp.cleanLogs.length) return defaultLogs

    return defaultLogs.map(dl => {
        const found = emp.cleanLogs.find(cl => cl.label === dl.label)
        return found ? found : dl
    })
}
</script>