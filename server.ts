// server.ts

import express, { Request, Response } from "express";
import { createClient } from "hafas-client";
import { profile } from "hafas-client/p/nahsh/index.js";
import { config } from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

config();

// Config

const PORT               = process.env.PORT                || "3000";
const DEFAULT_STATION    = process.env.DEFAULT_STATION      || "Hamburg Hbf";
const DEFAULT_FROM       = process.env.DEFAULT_PLANNER_FROM || "";
const DEFAULT_TO         = process.env.DEFAULT_PLANNER_TO   || "";
const UPDATE_INTERVAL_MS = Math.max(5000, parseInt(process.env.UPDATE_INTERVAL || "30000", 10));

// Types

type Station = { id: string; name: string };

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// Result helpers

function ok<T>(value: T): Result<T>      { return { ok: true,  value }; }
function fail(error: string): Result<never> { return { ok: false, error }; }

async function toResult<T>(p: Promise<T>): Promise<Result<T>> {
    try   { return ok(await p); }
    catch (e) { return fail(e instanceof Error ? e.message : String(e)); }
}

// HAFAS

const hafas = createClient(profile, "hh-transit");

async function findStation(query: string): Promise<Result<Station>> {
    if (!query.trim()) return fail("Empty query");

    const res = await toResult(hafas.locations(query, { results: 5 }));
    if (!res.ok) return res;

    const match =
        res.value.find((r: any) => r.type === "station" || r.type === "stop") ||
        res.value[0];

    if (!match) return fail("Station not found");
    return ok({ id: match.id || "", name: match.name || query });
}

async function loadDepartures(stationId: string): Promise<Result<any[]>> {
    const res = await toResult(
        hafas.departures(stationId, { duration: 60, remarks: true })
    );
    if (!res.ok) return res;

    const sorted = [...(res.value.departures || [])].sort((a: any, b: any) => {
        const at = new Date(a.when || a.plannedWhen).getTime() || 0;
        const bt = new Date(b.when || b.plannedWhen).getTime() || 0;
        return at - bt;
    });

    return ok(sorted);
}

async function loadJourneys(fromId: string, toId: string): Promise<Result<any[]>> {
    const res = await toResult(
        hafas.journeys(fromId, toId, { results: 4, walkingSpeed: "normal" })
    );
    if (!res.ok) return res;
    return ok(res.value.journeys || []);
}

// Express

const app = express();

app.use(cors());
app.use(express.static("public"));

const limiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", limiter);

// GET /api/config
// Returns client bootstrap values from .env so the HTML page needs no hardcoded defaults.
app.get("/api/config", (_req: Request, res: Response) => {
    res.json({
        defaultStation:  DEFAULT_STATION,
        defaultFrom:     DEFAULT_FROM,
        defaultTo:       DEFAULT_TO,
        updateIntervalMs: UPDATE_INTERVAL_MS,
    });
});

// GET /api/search?q=<query>
app.get("/api/search", async (req: Request, res: Response) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const result = await toResult(hafas.locations(q, { results: 8 }));
    if (!result.ok) {
        console.error("HAFAS Search Error:", result.error);
        return res.status(500).json({ error: "Search failed" });
    }
    return res.json(result.value || []);
});

// GET /api/departures?stationId=<id>
app.get("/api/departures", async (req: Request, res: Response) => {
    const stationId = String(req.query.stationId || "").trim();
    if (!stationId) return res.status(400).json({ error: "Missing stationId" });

    const result = await loadDepartures(stationId);
    if (!result.ok) {
        console.error("HAFAS Departures Error:", result.error);
        return res.status(500).json({ error: "Failed to fetch departures" });
    }
    return res.json(result.value);
});

// GET /api/planner?from=<query>&to=<query>
app.get("/api/planner", async (req: Request, res: Response) => {
    const from = String(req.query.from || "").trim();
    const to   = String(req.query.to   || "").trim();
    if (!from || !to) return res.status(400).json({ error: "Missing from or to" });

    const [originResult, destResult] = await Promise.all([
        findStation(from),
        findStation(to),
    ]);

    if (!originResult.ok) {
        return res.status(404).json({ error: `Origin: ${originResult.error}` });
    }
    if (!destResult.ok) {
        return res.status(404).json({ error: `Destination: ${destResult.error}` });
    }

    const journeysResult = await loadJourneys(originResult.value.id, destResult.value.id);
    if (!journeysResult.ok) {
        console.error("HAFAS Planner Error:", journeysResult.error);
        return res.status(500).json({ error: "Route planning failed" });
    }

    return res.json({
        origin:      originResult.value,
        destination: destResult.value,
        journeys:    journeysResult.value,
    });
});

// Start

app.listen(parseInt(PORT), () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Default station: ${DEFAULT_STATION}`);
    if (DEFAULT_FROM && DEFAULT_TO) {
        console.log(`Default route: ${DEFAULT_FROM} >> ${DEFAULT_TO}`);
    }
});
