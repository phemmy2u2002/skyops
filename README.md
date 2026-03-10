# SkyOps ✈️

**SkyOps** is a full-stack Aviation Flight Operations Management System designed for flight dispatchers, pilots, and operations staff. It combines a Node.js/Express REST API, a React web client, and a native iOS Electronic Flight Bag (EFB) app built with SwiftUI — all backed by MongoDB.

---

## What SkyOps Does

- **Flight management** – create, update, and track flights from scheduling through arrival.
- **Live weather** – fetch and display METAR/TAF data for any ICAO station with colour-coded flight categories (VFR / MVFR / IFR / LIFR).
- **NOTAMs** – browse, filter, and acknowledge Notices to Airmen for departure and destination airports.
- **Dispatch briefings** – auto-generate pre-flight briefing packages combining weather, NOTAMs, and crew information, shareable as a PDF or plain text.
- **Role-based access** – Admin, Dispatcher, Pilot, and Viewer roles with appropriate permissions at every layer.
- **Offline-first iOS EFB** – cached data survives connectivity loss; background refresh keeps information current.

---

## Tech Stack

| Layer          | Technology                                                     |
|----------------|----------------------------------------------------------------|
| Backend API    | Node.js 18 · Express 4 · MongoDB 6 · Mongoose · JWT           |
| Web Frontend   | React 18 · Redux Toolkit · RTK Query · Vite · Tailwind CSS    |
| iOS EFB        | Swift 5.9 · SwiftUI · Combine · Core Data · iOS 17+           |
| Auth           | JWT (HS256, 1 h) + refresh tokens · bcrypt · iOS Keychain     |
| Infrastructure | Docker · docker-compose · nginx · PM2                         |

---

## Directory Structure

```
skyops/
├── backend/                 # Node.js / Express API
│   ├── src/
│   │   ├── index.js         # Server entry point
│   │   ├── api/             # Route handlers (auth, flights, weather, notams, dispatch)
│   │   ├── middleware/      # JWT auth, error handling, logging, validation
│   │   └── models/          # Mongoose schemas
│   ├── tests/               # Jest integration tests
│   ├── .env.example
│   └── docker-compose.yml
│
├── frontend/                # React / Vite web client
│   ├── src/
│   │   ├── App.js
│   │   ├── store/           # Redux Toolkit + RTK Query
│   │   ├── components/      # Reusable UI components
│   │   └── pages/           # Dashboard, Flights, Weather, NOTAMs, Dispatch
│   └── vite.config.js
│
├── ios-efb/                 # Native iOS Electronic Flight Bag
│   ├── SkyOps/
│   │   ├── App/             # SkyOpsApp.swift · AppDelegate · ContentView
│   │   ├── Models/          # Flight · Weather · Notam · User
│   │   ├── Views/           # Dashboard · Flights · Weather · NOTAMs · Dispatch · Login
│   │   ├── Services/        # APIService · FlightService · WeatherService · AuthService
│   │   ├── Database/        # CoreDataManager · CacheManager · data model
│   │   └── Utilities/       # Extensions · Constants · AviationHelpers
│   └── SkyOps.xcodeproj/
│
└── docs/
    ├── API.md               # Full REST API reference
    ├── ARCHITECTURE.md      # System design and data flow
    └── DEPLOYMENT.md        # Setup, Docker, iOS build, production
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18, npm ≥ 9
- MongoDB 6 (local or Docker)
- Xcode 15+ (iOS development, macOS only)

### 1 – Start MongoDB

```bash
docker run -d --name skyops-mongo -p 27017:27017 mongo:6
```

### 2 – Backend

```bash
cd backend
cp .env.example .env        # set JWT_SECRET and MONGODB_URI
npm install
npm run dev                 # → http://localhost:3000
```

### 3 – Frontend

```bash
cd frontend
npm install
npm run dev                 # → http://localhost:5173
```

### 4 – iOS EFB

```bash
open ios-efb/SkyOps.xcodeproj
# Select a simulator or device and press ▶ in Xcode
```

---

## Documentation

| Document | Description |
|---|---|
| [docs/API.md](docs/API.md) | Complete REST API reference with request/response examples |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, security design |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local dev, Docker, iOS build, production deployment |

---

## Running Tests

```bash
cd backend
npm test                  # Jest test suite
npm run test:coverage     # with coverage report
```

---

## License

MIT © SkyOps Team
