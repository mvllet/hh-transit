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
```

## Run

```bash
bun run server.ts
```

Open in browser:

- Monitor: http://localhost:3000
- Planner: http://localhost:3000/planner.html

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
| Enter | Confirm search / Jump to next field |
| Esc | Close modal |
| R | Refresh data |

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.
