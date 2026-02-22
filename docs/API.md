# SkyOps API Documentation

Base URL: `http://localhost:3000/api` (development) · `https://api.skyops.aero/api` (production)

All endpoints (except `/auth/*`) require a valid JWT in the `Authorization: Bearer <token>` header.  
All request and response bodies are JSON (`Content-Type: application/json`).

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Flights](#2-flights)
3. [Weather](#3-weather)
4. [NOTAMs](#4-notams)
5. [Dispatch](#5-dispatch)
6. [Error Reference](#6-error-reference)

---

## 1. Authentication

### POST `/auth/register`

Creates a new user account.

**Request body**

```json
{
  "username": "jsmith",
  "email": "jsmith@skyops.aero",
  "password": "S3cur3P@ss!",
  "role": "DISPATCHER"
}
```

| Field      | Type   | Required | Notes                                        |
|------------|--------|----------|----------------------------------------------|
| `username` | string | ✓        | 3–30 chars, alphanumeric + underscore        |
| `email`    | string | ✓        | Valid email address                          |
| `password` | string | ✓        | Min 8 chars, at least one number and symbol  |
| `role`     | string | ✓        | `ADMIN` · `DISPATCHER` · `PILOT` · `VIEWER`  |

**Response `201 Created`**

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "refreshToken": "dGhpcyBp...",
  "user": {
    "id": "664a1f2e3b4c5d6e7f800001",
    "username": "jsmith",
    "email": "jsmith@skyops.aero",
    "role": "DISPATCHER"
  }
}
```

---

### POST `/auth/login`

Authenticates an existing user.

**Request body**

```json
{
  "username": "jsmith",
  "password": "S3cur3P@ss!"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "refreshToken": "dGhpcyBp...",
  "user": {
    "id": "664a1f2e3b4c5d6e7f800001",
    "username": "jsmith",
    "email": "jsmith@skyops.aero",
    "role": "DISPATCHER"
  }
}
```

---

### POST `/auth/refresh`

Issues a new access token using a valid refresh token.

**Request body**

```json
{ "refreshToken": "dGhpcyBp..." }
```

**Response `200 OK`**

```json
{
  "success": true,
  "token": "eyJhbGciNew...",
  "refreshToken": "bmV3UmVm..."
}
```

---

## 2. Flights

### GET `/flights`

Returns all flights visible to the authenticated user.

**Query parameters**

| Parameter  | Type   | Default | Description                                   |
|------------|--------|---------|-----------------------------------------------|
| `status`   | string | —       | Filter by status (e.g. `SCHEDULED`)           |
| `date`     | string | today   | ISO-8601 date (`2024-06-01`)                  |
| `departure`| string | —       | ICAO departure airport                        |
| `dest`     | string | —       | ICAO destination airport                      |
| `limit`    | number | 50      | Max records to return (1–200)                 |
| `page`     | number | 1       | Pagination page                               |

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "FLT-001",
      "flightNumber": "SKY101",
      "departure": "KJFK",
      "destination": "KLAX",
      "departureTime": "2024-06-01T14:00:00Z",
      "arrivalTime": "2024-06-01T19:30:00Z",
      "aircraft": "N12345",
      "status": "SCHEDULED",
      "crew": [
        { "id": "CRW-1", "name": "Capt. Jane Smith", "role": "CAPTAIN" },
        { "id": "CRW-2", "name": "FO John Doe",      "role": "FIRST_OFFICER" }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 1 }
}
```

---

### POST `/flights`

Creates a new flight. Requires `ADMIN` or `DISPATCHER` role.

**Request body**

```json
{
  "flightNumber": "SKY202",
  "departure": "KLAX",
  "destination": "KSFO",
  "departureTime": "2024-06-02T08:00:00Z",
  "arrivalTime":   "2024-06-02T09:15:00Z",
  "aircraft": "N67890",
  "crew": [
    { "id": "CRW-3", "name": "Capt. Alice Brown", "role": "CAPTAIN" }
  ]
}
```

**Response `201 Created`** – returns the created flight object (same shape as GET).

---

### GET `/flights/:id`

Returns a single flight by ID.

**Response `200 OK`** – single flight object.

---

### PUT `/flights/:id`

Updates an existing flight. Requires `ADMIN` or `DISPATCHER` role.

**Request body** – partial or full flight fields.

**Response `200 OK`** – updated flight object.

---

### DELETE `/flights/:id`

Deletes a flight. Requires `ADMIN` role.

**Response `200 OK`**

```json
{ "success": true, "message": "Flight deleted." }
```

---

## 3. Weather

### GET `/weather/:icao`

Returns the latest METAR for the given ICAO station.

**Path parameter**: `icao` – 4-letter ICAO code (e.g. `KJFK`).

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "icao": "KJFK",
    "rawText": "KJFK 011552Z 27015G25KT 10SM FEW030 BKN080 22/10 A2992",
    "observationTime": "2024-06-01T15:52:00Z",
    "temperature": 22,
    "dewpoint": 10,
    "windSpeed": 15,
    "windDirection": 270,
    "windGust": 25,
    "visibility": 10,
    "ceiling": 8000,
    "altimeter": 29.92,
    "flightCategory": "VFR",
    "weatherPhenomena": []
  }
}
```

---

### GET `/weather/:icao/taf`

Returns the latest Terminal Aerodrome Forecast for the station.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "icao": "KJFK",
    "rawText": "TAF KJFK 011130Z 0112/0218 27012KT P6SM FEW030..."
  }
}
```

---

## 4. NOTAMs

### GET `/notams`

Returns NOTAMs, optionally filtered.

**Query parameters**

| Parameter | Type   | Description                            |
|-----------|--------|----------------------------------------|
| `icao`    | string | Filter by airport ICAO                 |
| `type`    | string | `AERODROME` · `EN_ROUTE` · `WARNING` … |
| `active`  | bool   | `true` returns only currently-active   |
| `limit`   | number | Max records (default 100)              |

**Response `200 OK`**

```json
{
  "success": true,
  "data": [
    {
      "id": "NTM-001",
      "notamNumber": "A1234/24",
      "icao": "KJFK",
      "type": "AERODROME",
      "startDate": "2024-06-01T12:00:00Z",
      "endDate":   "2024-06-02T00:00:00Z",
      "text": "RWY 04R/22L CLSD DUE TO MAINTENANCE",
      "rawText": "A1234/24 NOTAMN\nQ) ZNY/QMRLC/IV/NBO/A/000/999/4037N07346W005\n...",
      "coordinates": { "latitude": 40.6413, "longitude": -73.7781, "radius": 5 }
    }
  ]
}
```

---

### GET `/notams/:id`

Returns a single NOTAM by ID.

**Response `200 OK`** – single NOTAM object.

---

## 5. Dispatch

### GET `/dispatch/briefing/:flightId`

Generates and returns a pre-flight briefing package for the specified flight.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "flightId": "FLT-001",
    "generatedAt": "2024-06-01T13:00:00Z",
    "departure": {
      "weather": { /* METAR object */ },
      "notams": [ /* NOTAM objects */ ]
    },
    "destination": {
      "weather": { /* METAR object */ },
      "notams": [ /* NOTAM objects */ ]
    },
    "alternate": null
  }
}
```

---

### POST `/dispatch/release/:flightId`

Issues an operational flight release. Requires `DISPATCHER` or `ADMIN` role.

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Flight SKY101 released for departure.",
  "releaseId": "REL-20240601-001",
  "releasedAt": "2024-06-01T13:45:00Z"
}
```

---

## 6. Error Reference

All error responses share this envelope:

```json
{
  "success": false,
  "message": "Human-readable description of the error."
}
```

| HTTP Status | Meaning                                                   |
|-------------|-----------------------------------------------------------|
| `400`       | Bad Request – missing or invalid request data             |
| `401`       | Unauthorized – missing or expired JWT                     |
| `403`       | Forbidden – insufficient role permissions                 |
| `404`       | Not Found – resource does not exist                       |
| `409`       | Conflict – duplicate resource (e.g. username taken)       |
| `422`       | Unprocessable Entity – validation errors                  |
| `429`       | Too Many Requests – rate limit exceeded (100 req/15 min)  |
| `500`       | Internal Server Error – unexpected server failure         |

### Validation error detail (`422`)

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "email", "message": "Must be a valid email address." }
  ]
}
```
