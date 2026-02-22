# hvv-monitor-web

A real-time, browser-based departure board and journey planner for the Hamburg Public Transport Network (HVV). This suite provides a professional, high-visibility interface for live departures and detailed route planning.

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
    * [Departure Monitor](#1-departure-monitor)
    * [Route Planner](#2-route-planner)
* [Controls](#controls)
* [Configuration](#configuration)
* [Shell Integration](#shell-integration)
* [Contributing](#contributing)
* [License](#license)

## Features

* **Real-time Data Retrieval**: Fetches live data utilizing the `hafas-client` library via a Node.js backend proxy.
* **Fullscreen-Optimized Design**: High-contrast, monospace UI designed for maximum readability on monitors and mobile devices.
* **Accurate Line Representation**: Applies official HVV transit color codes for U-Bahn, S-Bahn, AKN, and Regional rail lines.
* **Deep Linking**: Full support for URL parameters (`?q=` or `?from=&to=`), allowing you to bookmark specific stations or share routes.
* **Sticky Navigation**: Fixed headers and touch-optimized footers ensure seamless control even during long-list scrolling.
* **Journey Planning**: Search for connections with transfer details, real-time status tracking, and delay indicators.

## Prerequisites

Before utilizing this application, ensure the following dependencies are installed:

* **Node.js**: Version 20.20.0 or higher.
* **npm**: Node Package Manager (included with Node.js).

## Installation

#### 1. Clone the repository:

```bash
git clone https://github.com/marshmallow868/hvv-monitor-web.git
```

#### 2. Navigate into the project directory:

```bash
cd hvv-monitor-web
```

#### 3. Install dependencies:

```bash
npm install
```

## Usage

#### Start the Server:

```bash
node server.js
```

The application will be hosted at `http://localhost:3000`.

#### 1. General Monitor

The primary dashboard with station search and a full-screen, sticky-header layout.

* **URL**: `http://localhost:3000/index.html`
* **Query Support**: `index.html?q=Hamburg+Hbf`

#### 2. Route Planner

A specialized tool to plan journeys between two locations. Displays detailed legs with real-time delays.

* **URL**: `http://localhost:3000/planner.html`
* **Query Support**: `planner.html?from=Altona&to=Dammtor`

## Controls

The application is optimized for both touch and keyboard inputs.

| Key | Action |
| --- | --- |
| **S** | Open search modal / Plan new journey |
| **Enter** | **General**: Confirm search <br> **Planner**: Jump to next field / Confirm route |
| **Esc** | Close modal without searching |
| **R** | Execute a manual data refresh |

## Configuration

#### Update Frequency:

To change the automated refresh interval (default 30s), modify the `refreshInterval` constant in the `<script>` section of the HTML files:

```javascript
const State = {
    refreshInterval: 30000 // Time in milliseconds
};
```

## Contributing

Modifications, bug reports, and feature requests are welcome. If you wish to contribute to the codebase, please open an issue first to discuss the proposed changes. For significant code additions, standard pull request procedures apply.

## License

#### Copyright (c) 2026 Mullet. All rights reserved.

This software is provided for personal or internal use.
- **Prohibited**: Commercial sale, redistribution, or integration into other commercial projects without express written permission from **Mullet**.
- See the `LICENSE` file for full details.