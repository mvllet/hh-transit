# hvv-monitor

This is a real-time, browser-based departure monitor and route planner for the Hamburg Public Transport Network (HVV). This suite offers an interface for live departures and detailed route planning.

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
  * [Departure Monitor](#1-departure-monitor)
  * [Route Planner](#2-route-planner)
* [Controls](#controls)
* [Configuration](#configuration)
* [Contributing](#contributing)
* [License](#license)

## Features

* **Real-time Data Retrieval**: Fetches live data using the `hafas-client` library via a Node.js backend proxy.
* **Fullscreen-Optimized Design**: High-contrast, monospace UI for readability on monitors and mobile devices.
* **Accurate Line Representation**: Official HVV transit color codes for U-Bahn, S-Bahn, AKN, and Regional rail lines.
* **Deep Linking**: URL parameters (`?q=` or `?from=&to=`) allow bookmarking stations or sharing routes.
* **Sticky Navigation**: Fixed headers and footers for seamless control during scrolling.
* **Journey Planning**: Search connections with transfer details, real-time status, and delay indicators.

## Prerequisites

* **Node.js**: Version 18.0.0 or higher.
* **npm**: Node Package Manager.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/mvllet/hvv-monitor.git
```

2. Navigate into the project directory:

```bash
cd hvv-monitor
```

3. Install dependencies:

```bash
npm install
```

## Usage

Start the server:

```bash
node server.js
```

Application will run at `http://localhost:3000`.

### 1. Departure Monitor

* **URL**: `http://localhost:3000/index.html`
* **Query Support**: `index.html?q=Hamburg+Hbf`

### 2. Route Planner

* **URL**: `http://localhost:3000/planner.html`
* **Query Support**: `planner.html?from=Altona&to=Dammtor`

## Controls

| Key       | Action                                                                           |
| --------- | -------------------------------------------------------------------------------- |
| **S**     | Open search modal / Plan new journey                                             |
| **Enter** | **Monitor**: Confirm search <br> **Planner**: Jump to next field / Confirm route |
| **Esc**   | Close modal without searching                                                    |
| **R**     | Execute manual data refresh                                                      |

## Configuration

To modify the automated refresh interval (default 30s), edit the `refreshInterval` constant in the `<script>` section of the HTML files:

```javascript
const State = {
    refreshInterval: 30000 // Time in milliseconds
};
```

## Contributing

Bug reports, feature requests, and code contributions are welcome. Open an issue to discuss proposed changes. Pull requests follow standard procedures.

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.