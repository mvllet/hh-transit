import express from "express";
import { createClient } from "hafas-client";
import { profile } from "hafas-client/p/nahsh/index.js";

const app = express();

const PORT = 3000;

const hafas = createClient(profile, "hvv-monitor");

app.use(express.static("public"));

async function findStation(query) {
    if (!query) return null;
    const results = await hafas.locations(query, { results: 5 });
    return (results || []).find(r => r.type === "station" || r.type === "stop") || results[0] || null;
}

app.get("/api/search", async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) return res.json([]);
        const results = await hafas.locations(q, { results: 8 });
        return res.json(results || []);
    } catch (err) {
        console.error("HAFAS Search Error:", err && err.stack || err);
        return res.status(500).json({ error: "Search failed" });
    }
});

app.get("/api/departures", async (req, res) => {
    try {
        const stationId = String(req.query.stationId || "").trim();
        if (!stationId) return res.status(400).json({ error: "Missing stationId" });

        const response = await hafas.departures(stationId, {
            duration: 60,
            remarks: true
        });

        return res.json(response && response.departures ? response.departures : []);
    } catch (err) {
        console.error("HAFAS Departures Error:", err && err.stack || err);
        return res.status(500).json({ error: "Failed to fetch departures" });
    }
});

app.get("/api/planner", async (req, res) => {
    try {
        const from = String(req.query.from || "").trim();
        const to = String(req.query.to || "").trim();
        if (!from || !to) return res.status(400).json({ error: "Missing from or to" });

        const origin = await findStation(from);
        const destination = await findStation(to);

        if (!origin || !destination) return res.status(404).json({ error: "Station not found" });

        const response = await hafas.journeys(origin.id, destination.id, {
            results: 4,
            walkingSpeed: "normal"
        });

        return res.json({
            origin,
            destination,
            journeys: response && response.journeys ? response.journeys : []
        });
    } catch (err) {
        console.error("HAFAS Planner Error:", err && err.stack || err);
        return res.status(500).json({ error: "Route planning failed" });
    }
});

app.listen(PORT, () => {
    console.log(`
Server running on port ${PORT}

Departure Monitor:  http://localhost:${PORT}/index.html
Route Planner:      http://localhost:${PORT}/planner.html
    `);
});
