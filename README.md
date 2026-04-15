# HH Transit

Real-time browser departure monitor and route planner for Hamburg public transport.

## Features

- Live departures for any Hamburg station
- Journey planner between stations
- Deep linking via URL parameters
- Auto-refresh with real-time data

## Prerequisites

- [Bun](https://bun.sh) runtime

## Setup

```bash
bun install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Configure optional environment variables:

```bash
# Server port (default: 3000)
PORT=3000

# Default station for monitor
DEFAULT_STATION=Hamburg Hbf

# Default journey for planner
DEFAULT_PLANNER_FROM=Hamburg Hbf
DEFAULT_PLANNER_TO=Berlin Hbf

# Refresh interval in milliseconds (default: 30000)
UPDATE_INTERVAL=30000
```

## Run

```bash
bun run server.ts
```

Open in browser:

```
http://localhost:3000
```

## Deep Linking

Bookmark stations or share routes via URL parameters:

```
?q=Hamburg Hbf
?from=Altona&to=Dammtor
```

## Controls

| Key | Action |
|-----|--------|
| S | Open search / planner modal |
| Tab | Jump to next field |
| Enter | Confirm search |
| Esc | Close modal |
| R | Refresh data |

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.
