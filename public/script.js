// script.js

const productColors = {
    nationalExpress: "var(--c-ice)",
    national: "var(--c-ic)",
    regionalExpress: "var(--c-re)",
    regional: "var(--c-rb)",
    suburban: "var(--c-sbahn)",
    bus: "var(--c-bus)",
    ferry: "var(--c-ferry)",
    subway: "var(--c-ubahn)",
    tram: "var(--c-tram)",
    taxi: "var(--c-taxi)"
}

const appState = {
    tab: "monitor",
    currentStation: null,
    lastFrom: "",
    lastTo: "",
    isBusy: false,
    refreshTimer: null,
    updateIntervalMs: 30000,
    defaultStation: "Hamburg Hbf",
    defaultFrom: "",
    defaultTo: ""
}

// format station names
function normalizeStation(name) {
    if (!name) return ""
    let cleanName = String(name)
        .replace(/-/g, " ")
        .replace(/\//g, " ")
        .replace(/\s*\(\s*/g, " (")
        .replace(/\s*\)\s*/g, ") ")
    cleanName = cleanName.replace(/\s+/g, " ").trim()
    const hubs = ["hbf", "airport", "altona", "dammtor", "harburg", "bergedorf"]
    if (hubs.some(h => cleanName.toLowerCase().includes(h))) {
        return cleanName
    }
    return cleanName.split(/\s+/)
        .filter(w => !["hamburg", "hh"].includes(w.toLowerCase()))
        .join(" ").trim()
}

// format time string
function formatClock(isoString) {
    if (!isoString) return "--:--"
    const dateObj = new Date(isoString)
    if (isNaN(dateObj)) return "--:--"
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// calculate delay minutes
function calculateDelay(seconds) {
    if (seconds == null || !isFinite(seconds)) return 0
    return Math.max(0, Math.round(Number(seconds) / 60))
}

// create status cell
function createStatusCell(delaySeconds) {
    const delay = calculateDelay(delaySeconds)
    const cell = document.createElement("td")
    cell.className = "col-status"
    const span = document.createElement("span")
    span.className = delay > 0 ? "status-late" : "status-ok"
    span.textContent = delay > 0 ? `+${delay}m` : "OK"
    cell.appendChild(span)
    return cell
}

// determine line color
function getLineColor(departure) {
    const product = departure && departure.line && departure.line.product
    if (product && productColors[product]) return productColors[product]
    return "var(--c-bus)"
}

// extract line name
function getLineName(departure) {
    const raw = (departure && departure.line && departure.line.name) || ""
    return raw.replace(/^BUS\s+/i, "") || "-"
}

// determine leg color
function getLegColor(leg) {
    if (leg.walking) return "var(--c-walk)"
    return getLineColor(leg)
}

// extract leg name
function getLegName(leg) {
    if (leg.walking) {
        const dist = leg.distance ? `${Math.round(leg.distance)}m` : ""
        return dist ? `Walk ${dist}` : "Walk"
    }
    return getLineName(leg)
}

// update footer status
function setStatus(text, className) {
    const element = document.getElementById("sync-status")
    element.textContent = text
    element.className = className
}

// update board header
function setBoardLabel(text) {
    document.getElementById("board-label").textContent = text
}

// fetch departures data
async function fetchDepartures(stationId) {
    const url = `/api/departures?stationId=${encodeURIComponent(stationId)}`
    const response = await fetch(url)
    if (!response.ok) {
        return { ok: false, error: "fetch failed" }
    }
    const data = await response.json()
    return { ok: true, value: data }
}

// fetch planner data
async function fetchPlanner(origin, destination) {
    const url = `/api/planner?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`
    const response = await fetch(url)
    if (!response.ok) {
        return { ok: false, error: "fetch failed" }
    }
    const data = await response.json()
    return { ok: true, value: data }
}

// fetch search data
async function fetchSearch(query) {
    const url = `/api/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url)
    if (!response.ok) {
        return { ok: false, error: "fetch failed" }
    }
    const data = await response.json()
    return { ok: true, value: data }
}

// render monitor view
function renderMonitor(departures) {
    const container = document.getElementById("monitor-content")
    if (!Array.isArray(departures) || departures.length === 0) {
        container.innerHTML = '<div class="board-message">No departures found</div>'
        return
    }
    const table = document.createElement("table")
    table.className = "board-table"
    const head = document.createElement("thead")
    head.innerHTML = `<tr>
        <th class="col-line">Line</th>
        <th class="col-dir">Direction</th>
        <th class="col-time">Dep</th>
        <th class="col-status">Status</th>
    </tr>`
    table.appendChild(head)
    const body = document.createElement("tbody")
    for (const item of departures) {
        body.appendChild(createDepartureRow(item))
    }
    table.appendChild(body)
    container.innerHTML = ""
    container.appendChild(table)
}

// create departure row
function createDepartureRow(item) {
    const row = document.createElement("tr")
    const timeStr = formatClock(item.when || item.plannedWhen)
    const dirStr = normalizeStation(item.direction)
    row.innerHTML = `
        <td class="col-line" style="color: ${getLineColor(item)}">${getLineName(item)}</td>
        <td class="col-dir">${dirStr}</td>
        <td class="col-time">${timeStr}</td>
    `
    row.appendChild(createStatusCell(item.delay))
    return row
}

// render planner view
function renderPlanner(journeys) {
    const container = document.getElementById("planner-content")
    if (!Array.isArray(journeys) || journeys.length === 0) {
        container.innerHTML = '<div class="board-message">No routes found</div>'
        return
    }
    const fragment = document.createDocumentFragment()
    journeys.forEach((journey, index) => {
        const block = createJourneyBlock(journey, index)
        fragment.appendChild(block)
    })
    container.innerHTML = ""
    container.appendChild(fragment)
}

// create journey block
function createJourneyBlock(journey, index) {
    const legs = Array.isArray(journey.legs) ? journey.legs : []
    const duration = calculateDuration(legs)
    const transfers = Math.max(0, legs.filter(l => !l.walking).length - 1)
    const block = document.createElement("div")
    block.className = "journey-block"
    const header = document.createElement("div")
    header.className = "journey-header"
    const suffix = transfers !== 1 ? "s" : ""
    header.textContent = `Option ${index + 1} • ${duration} min • ${transfers} transfer${suffix}`
    block.appendChild(header)
    const table = buildLegsTable(legs, index === 0)
    block.appendChild(table)
    return block
}

// calculate journey duration
function calculateDuration(legs) {
    const firstLeg = legs[0]
    const lastLeg = legs[legs.length - 1]
    const depTime = firstLeg && new Date(firstLeg.departure || firstLeg.plannedDeparture)
    const arrTime = lastLeg && new Date(lastLeg.arrival || lastLeg.plannedArrival)
    if (depTime && arrTime && !isNaN(depTime) && !isNaN(arrTime)) {
        return Math.max(0, Math.round((arrTime - depTime) / 60000))
    }
    return 0
}

// build legs table
function buildLegsTable(legs, showHeader) {
    const table = document.createElement("table")
    table.className = "board-table"
    if (showHeader) {
        const head = document.createElement("thead")
        head.innerHTML = `<tr>
            <th class="col-pline">Line</th>
            <th class="col-pdep">Dep</th>
            <th class="col-pfrom">From</th>
            <th class="col-parr">Arr</th>
            <th class="col-pto">To</th>
            <th class="col-pstat">Status</th>
        </tr>`
        table.appendChild(head)
    }
    const body = document.createElement("tbody")
    for (const leg of legs) {
        body.appendChild(createLegRow(leg))
    }
    table.appendChild(body)
    return table
}

// create leg row
function createLegRow(leg) {
    const row = document.createElement("tr")
    const depTime = formatClock(leg.departure || leg.plannedDeparture)
    const arrTime = formatClock(leg.arrival || leg.plannedArrival)
    const originName = normalizeStation(leg.origin && leg.origin.name)
    const destName = normalizeStation(leg.destination && leg.destination.name)
    row.innerHTML = `
        <td class="col-pline" style="color: ${getLegColor(leg)}">${getLegName(leg)}</td>
        <td class="col-pdep">${depTime}</td>
        <td class="col-pfrom">${originName}</td>
        <td class="col-parr">${arrTime}</td>
        <td class="col-pto">${destName}</td>
    `
    row.appendChild(createStatusCell(leg.departureDelay))
    return row
}

// execute monitor update
async function updateMonitor() {
    if (!appState.currentStation) {
        setStatus("Loading...", "dim")
        const result = await fetchSearch(appState.defaultStation)
        if (!result.ok) {
            setStatus("Error", "error")
            return
        }
        const list = result.value
        const match = Array.isArray(list) ? list.find(r => r.type === "station" || r.type === "stop") || list[0] : null
        if (!match) {
            setStatus("Error", "error")
            return
        }
        appState.currentStation = { id: match.id, name: match.name }
    }
    setStatus("Updating...", "dim")
    const response = await fetchDepartures(appState.currentStation.id)
    if (!response.ok) {
        setStatus("Error", "error")
        return
    }
    const nameStr = normalizeStation(appState.currentStation.name)
    setBoardLabel(`${nameStr}`)
    renderMonitor(response.value)
    setStatus("Live", "ok")
}

// execute planner update
async function updatePlanner() {
    if (!appState.lastFrom || !appState.lastTo) {
        setStatus("Ready", "dim")
        return
    }
    setStatus("Planning...", "dim")
    const response = await fetchPlanner(appState.lastFrom, appState.lastTo)
    if (!response.ok) {
        setStatus("Error", "error")
        return
    }
    const data = response.value
    const fromStr = normalizeStation(data.origin && data.origin.name || appState.lastFrom)
    const toStr = normalizeStation(data.destination && data.destination.name || appState.lastTo)
    setBoardLabel(`${fromStr} → ${toStr}`)
    renderPlanner(Array.isArray(data.journeys) ? data.journeys : [])
    setStatus("Ready", "dim")
    const url = new URL(window.location.href)
    url.searchParams.set("from", appState.lastFrom)
    url.searchParams.set("to", appState.lastTo)
    window.history.replaceState({}, "", url)
}

// handle dashboard refresh
async function updateDashboard() {
    if (appState.isBusy) return
    appState.isBusy = true
    if (appState.tab === "monitor") {
        await updateMonitor()
    } else {
        await updatePlanner()
    }
    appState.isBusy = false
}

// handle tab transition
function switchTab(tabName) {
    appState.tab = tabName
    closeModal()
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"))
    document.getElementById(`tab-${tabName}`).classList.add("active")
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"))
    document.getElementById(`panel-${tabName}`).classList.add("active")
    
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tabName)
    window.history.replaceState({}, "", url)
    
    void updateDashboard()
}

// handle modal open
function openModal(modalId, focusId) {
    document.getElementById("modal-overlay").classList.add("open")
    document.getElementById(modalId).classList.add("open")
    setTimeout(() => document.getElementById(focusId)?.focus(), 80)
}

// handle modal close
function closeModal() {
    document.querySelectorAll(".modal").forEach(mod => mod.classList.remove("open"))
    document.getElementById("modal-overlay").classList.remove("open")
    document.activeElement?.blur()
}

// trigger search interface
function openSearch() {
    if (appState.tab !== "monitor") return
    document.getElementById("search-input").value = ""
    openModal("search-modal", "search-input")
}

// trigger planner interface
function openPlannerModal() {
    if (appState.tab !== "planner") return
    document.getElementById("input-from").value = appState.lastFrom
    document.getElementById("input-to").value = appState.lastTo
    openModal("planner-modal", "input-from")
}

// process search request
async function submitSearch() {
    const query = document.getElementById("search-input").value.trim()
    closeModal()
    if (!query) return
    appState.currentStation = null
    appState.isBusy = false
    const response = await fetchSearch(query)
    if (!response.ok) {
        setStatus("Error", "error")
        return
    }
    const list = response.value
    const match = Array.isArray(list) ? list.find(r => r.type === "station" || r.type === "stop") || list[0] : null
    if (!match) {
        setStatus("Not found", "error")
        return
    }
    appState.currentStation = { id: match.id, name: match.name }
    const url = new URL(window.location.href)
    url.searchParams.set("q", query)
    window.history.replaceState({}, "", url)
    void updateDashboard()
}

// process planner request
function submitPlanner() {
    const originStr = document.getElementById("input-from").value.trim()
    const destStr = document.getElementById("input-to").value.trim()
    closeModal()
    if (!originStr || !destStr) return
    appState.lastFrom = originStr
    appState.lastTo = destStr
    void updatePlanner()
}

// map key bindings
window.addEventListener("keydown", event => {
    const activeModal = document.querySelector(".modal.open")
    if (event.key === "Escape") {
        closeModal()
        return
    }
    if (activeModal) {
        if (event.key === "Enter") {
            if (document.getElementById("search-modal").classList.contains("open")) submitSearch()
            if (document.getElementById("planner-modal").classList.contains("open")) submitPlanner()
        }
        return
    }
    const keyChar = event.key.toLowerCase()
    if (keyChar === "1") { event.preventDefault(); switchTab("monitor") }
    if (keyChar === "2") { event.preventDefault(); switchTab("planner") }
    if (keyChar === "r") { event.preventDefault(); void updateDashboard() }
    if (keyChar === "s") {
        event.preventDefault()
        if (appState.tab === "monitor") openSearch()
        else openPlannerModal()
    }
})

// bind planner inputs
document.getElementById("input-from").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault()
        document.getElementById("input-to").focus()
    }
})

// bind planner inputs
document.getElementById("input-to").addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault()
        submitPlanner()
    }
})

// update header clock
function updateClock() {
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    document.getElementById("live-clock").textContent = timeString
}

// setup polling cycle
function startRefresh() {
    if (appState.refreshTimer) clearInterval(appState.refreshTimer)
    appState.refreshTimer = setInterval(() => void updateDashboard(), appState.updateIntervalMs)
}

// initialize application
async function boot() {
    const response = await fetch("/api/config")
    if (response.ok) {
        const config = await response.json()
        appState.defaultStation = config.defaultStation || "Hamburg Hbf"
        appState.defaultFrom = config.defaultFrom || ""
        appState.defaultTo = config.defaultTo || ""
        appState.updateIntervalMs = config.updateIntervalMs || 30000
    }

    const params = new URLSearchParams(window.location.search)
    const paramTab = params.get("tab")
    const paramQ = params.get("q")
    const paramFrom = params.get("from")
    const paramTo = params.get("to")
    
    let initialTab = "monitor";

    if (paramFrom && paramTo) {
        appState.lastFrom = paramFrom;
        appState.lastTo = paramTo;
    } else if (appState.defaultFrom && appState.defaultTo) {
        appState.lastFrom = appState.defaultFrom;
        appState.lastTo = appState.defaultTo;
    }

    if (paramQ) {
        appState.defaultStation = paramQ;
    }

    if (paramTab === "planner") {
        initialTab = "planner";
    }

    switchTab(initialTab);
    updateClock();
    setInterval(updateClock, 1000);
    startRefresh();
}

void boot()
