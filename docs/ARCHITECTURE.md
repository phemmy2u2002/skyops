# SkyOps Architecture Documentation

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            SkyOps Platform                              │
│                                                                         │
│  ┌──────────────┐    HTTPS/REST    ┌─────────────────────────────────┐  │
│  │  iOS EFB     │◄────────────────►│         Backend API             │  │
│  │  (SwiftUI)   │                 │   (Node.js / Express / MongoDB) │  │
│  └──────────────┘                 └───────────────┬─────────────────┘  │
│                                                   │                     │
│  ┌──────────────┐    HTTPS/REST                   │ Mongoose ODM        │
│  │  Web Client  │◄────────────────────────────────┤                     │
│  │  (React/Vite)│                                 │                     │
│  └──────────────┘                  ┌──────────────▼──────────────────┐  │
│                                    │          MongoDB Atlas           │  │
│                                    │   (flights, users, notams, …)   │  │
│                                    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

External data feeds (METAR, TAF, NOTAMs) are fetched by the backend from
aviation data providers (e.g. aviationweather.gov, FAA NOTAM API) and cached
in MongoDB to reduce latency and API costs.

---

## 2. Backend Architecture (Node.js / Express / MongoDB)

```
backend/src/
├── index.js              ← Express bootstrap, middleware chain, DB connect
├── api/
│   ├── index.js          ← Mounts all route groups under /api
│   ├── auth/             ← POST /auth/register, /login, /refresh
│   ├── flights/          ← CRUD for flight records
│   ├── weather/          ← Proxy + cache for METAR/TAF
│   ├── notams/           ← Proxy + cache for NOTAM feeds
│   └── dispatch/         ← Briefing generation, flight release
├── middleware/
│   ├── auth.js           ← JWT verification middleware
│   ├── errorHandler.js   ← Centralised error handler
│   ├── logger.js         ← Winston structured logger
│   └── validate.js       ← Joi schema validation
└── models/               ← Mongoose schemas (User, Flight, Weather, Notam)
```

### Middleware chain (per request)

```
Request → helmet → cors → json parser → rate limiter → logger
        → [JWT auth] → route handler → [Joi validation]
        → controller → Mongoose → MongoDB
        → response / errorHandler
```

### Key dependencies

| Package           | Purpose                              |
|-------------------|--------------------------------------|
| `express`         | HTTP framework                       |
| `mongoose`        | MongoDB ODM                          |
| `jsonwebtoken`    | JWT sign / verify                    |
| `bcryptjs`        | Password hashing (10 rounds)         |
| `helmet`          | Security headers                     |
| `express-rate-limit` | API rate limiting (100/15 min)    |
| `joi`             | Request body validation              |
| `winston`         | Structured JSON logging              |
| `axios`           | Outbound HTTP to aviation data feeds |

---

## 3. Frontend Architecture (React / Redux / Vite)

```
frontend/src/
├── index.js          ← React root, store provider
├── App.js            ← Router, top-level layout
├── store/            ← Redux Toolkit slices + RTK Query API
├── components/       ← Reusable UI components
├── pages/            ← Route-level page components
│   ├── Dashboard/
│   ├── Flights/
│   ├── Weather/
│   ├── NOTAMs/
│   └── Dispatch/
├── hooks/            ← Custom React hooks
├── utils/            ← Date formatting, aviation helpers
└── assets/           ← Static images, fonts
```

### State management

- **RTK Query** for server state (cache, background re-fetch, optimistic updates)
- **Redux Toolkit slices** for local UI state (selected flight, filter settings)
- **React Context** for authentication state

### Build tool

Vite provides sub-second HMR and tree-shaken production bundles.

---

## 4. iOS EFB Architecture (SwiftUI / Combine / CoreData)

```
ios-efb/SkyOps/
├── App/
│   ├── SkyOpsApp.swift    ← @main entry, scene setup, CoreData injection
│   ├── AppDelegate.swift  ← UIApplicationDelegate, background fetch
│   └── ContentView.swift  ← Tab bar navigation (5 tabs)
├── Models/                ← Pure Swift structs (Codable, Identifiable)
│   ├── Flight.swift
│   ├── Weather.swift
│   ├── Notam.swift
│   └── User.swift
├── Views/                 ← SwiftUI views + @MainActor ViewModels
│   ├── DashboardView.swift
│   ├── FlightsView.swift
│   ├── WeatherView.swift
│   ├── NotamsView.swift
│   ├── DispatchView.swift
│   └── LoginView.swift
├── Services/              ← Network + auth (URLSession + Combine/async-await)
│   ├── APIService.swift   ← Central HTTP client, 401 token refresh
│   ├── FlightService.swift
│   ├── WeatherService.swift
│   └── AuthService.swift  ← Keychain-backed token management
├── Database/              ← Offline persistence
│   ├── CoreDataManager.swift   ← NSPersistentContainer, background contexts
│   ├── CacheManager.swift      ← TTL-based memory + disk JSON cache
│   └── SkyOpsDataModel.xcdatamodeld/
└── Utilities/
    ├── Extensions.swift   ← Date/Color/String/View extensions
    ├── Constants.swift    ← API URL, timeouts, TTLs, aviation constants
    └── AviationHelpers.swift ← ICAO validation, FL conversion, coordinates
```

### Data flow

```
Network (URLSession) ──► APIService ──► Service layer (FlightService, etc.)
                                              │
                                    ┌─────────┴──────────┐
                                    ▼                    ▼
                             CacheManager          CoreDataManager
                          (in-memory + disk)     (NSPersistentStore)
                                    │
                                    ▼
                             ViewModel (@MainActor / @StateObject)
                                    │
                                    ▼
                             SwiftUI View (@Published)
```

### Offline-first strategy

1. On launch, ViewModels request data from the **Service layer**.
2. The Service layer immediately emits **cached data** (CacheManager / CoreData) for instant display.
3. A network request runs concurrently; fresh data is merged and cached.
4. If offline, cached data is displayed with a stale-data indicator.

---

## 5. Security Architecture

| Layer              | Mechanism                                                      |
|--------------------|----------------------------------------------------------------|
| Transport          | HTTPS / TLS 1.2+ enforced (ATS on iOS, HSTS header on server) |
| Authentication     | JWT (HS256, 1 h expiry) + refresh token (7 days, rotated)     |
| Password storage   | bcrypt with cost factor 10                                     |
| Token storage (iOS)| iOS Keychain (kSecClassGenericPassword)                        |
| API rate limiting  | 100 requests / 15 minutes per IP                               |
| CORS               | Configurable allowlist via `ALLOWED_ORIGINS` env var           |
| Security headers   | helmet (CSP, HSTS, X-Frame-Options, …)                        |
| Role-based access  | Middleware checks `user.role` before mutating resources        |
| Input validation   | Joi schemas on all POST/PUT endpoints                          |

---

## 6. Caching Strategy

| Data         | iOS TTL  | Backend cache | Notes                              |
|--------------|----------|---------------|------------------------------------|
| Flights      | 5 min    | MongoDB       | Invalidated on any flight mutation |
| METAR        | 30 min   | MongoDB       | Refreshed every 30 min by cron     |
| TAF          | 1 h      | MongoDB       | Refreshed every hour by cron       |
| NOTAMs       | 1 h      | MongoDB       | Refreshed every hour by cron       |
| Dispatch pkg | Session  | —             | Generated on demand, not persisted |

---

## 7. Database Schema Overview

### Users

| Field        | Type     | Notes                     |
|--------------|----------|---------------------------|
| `_id`        | ObjectId |                           |
| `username`   | String   | Unique, indexed           |
| `email`      | String   | Unique, indexed           |
| `password`   | String   | bcrypt hash               |
| `role`       | String   | Enum                      |
| `createdAt`  | Date     | Auto (timestamps: true)   |
| `updatedAt`  | Date     | Auto                      |

### Flights

| Field           | Type     | Notes             |
|-----------------|----------|-------------------|
| `_id`           | ObjectId |                   |
| `flightNumber`  | String   | Indexed           |
| `departure`     | String   | ICAO code         |
| `destination`   | String   | ICAO code         |
| `departureTime` | Date     | Indexed           |
| `arrivalTime`   | Date     |                   |
| `aircraft`      | String   | Registration      |
| `status`        | String   | Enum, indexed     |
| `crew`          | Array    | Embedded subdocs  |

### Weather (cache collection)

| Field             | Type   | Notes                        |
|-------------------|--------|------------------------------|
| `icao`            | String | Unique, indexed              |
| `rawText`         | String |                              |
| `flightCategory`  | String | Enum                         |
| `fetchedAt`       | Date   | TTL index (expires in 2 h)   |

### Notams (cache collection)

| Field        | Type   | Notes                   |
|--------------|--------|-------------------------|
| `notamNumber`| String | Unique, indexed         |
| `icao`       | String | Indexed                 |
| `startDate`  | Date   | Indexed                 |
| `endDate`    | Date   | Nullable (PERM)         |
| `fetchedAt`  | Date   | TTL index (expires 2 h) |
