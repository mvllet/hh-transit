// server.ts

import express, { Request, Response } from "express";
import { createClient } from "hafas-client";
import { profile } from "hafas-client/p/nahsh/index.js";
import { config } from "dotenv"
import cors from "cors"

config()

const app = express()
const port = process.env.PORT || 3000
const hafas = createClient(profile, "hh-transit");

// enable cross-origin resource sharing
app.use(cors())
app.use(express.static("public"))

app.use(express.static("public"));

// find a station based on query string
async function findStation(query: string): Promise<any> {
    if (!query) {
        return null;
    }
    const results = await hafas.locations(query, { results: 5 });
    const station = (results || []).find((r: any) => {
        return r.type === "station" || r.type === "stop";
    });
    return station || results[0] || null;
}

// handle location search requests
app.get("/api/search", async (req: Request, res: Response) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) {
            return res.json([]);
        }
        const results = await hafas.locations(q, { results: 8 });
        return res.json(results || []);
    } catch (err: any) {
        console.error("HAFAS Search Error:", (err && err.stack) || err);
        return res.status(500).json({ error: "Search failed" });
    }
});

// handle departure board requests
app.get("/api/departures", async (req: Request, res: Response) => {
    try {
        const stationId = String(req.query.stationId || "").trim();
        if (!stationId) {
            return res.status(400).json({ error: "Missing stationId" });
        }
        const response = await hafas.departures(stationId, {
            duration: 60,
            remarks: true,
        });
        const departures =
            response && response.departures ? response.departures : [];
        return res.json(departures);
    } catch (err: any) {
        console.error("HAFAS Departures Error:", (err && err.stack) || err);
        return res.status(500).json({ error: "Failed to fetch departures" });
    }
});

// handle journey planning requests
app.get("/api/planner", async (req: Request, res: Response) => {
    try {
        const from = String(req.query.from || "").trim();
        const to = String(req.query.to || "").trim();
        if (!from || !to) {
            return res.status(400).json({ error: "Missing from or to" });
        }
        const origin = await findStation(from);
        const destination = await findStation(to);
        if (!origin || !destination) {
            return res.status(404).json({ error: "Station not found" });
        }
        const response = await hafas.journeys(origin.id, destination.id, {
            results: 4,
            walkingSpeed: "normal",
        });
        const journeys = response && response.journeys ? response.journeys : [];
        return res.json({
            origin,
            destination,
            journeys,
        });
    } catch (err: any) {
        console.error("HAFAS Planner Error:", (err && err.stack) || err);
        return res.status(500).json({ error: "Route planning failed" });
    }
});

// start listening for connections
app.listen(port, () => {
    console.log("Server running on port " + port);
});
