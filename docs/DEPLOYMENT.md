# SkyOps Deployment Guide

## Prerequisites

| Tool          | Minimum version | Notes                               |
|---------------|-----------------|-------------------------------------|
| Node.js       | 18.x            | LTS recommended                     |
| npm           | 9.x             |                                     |
| MongoDB       | 6.x             | Atlas or self-hosted                |
| Docker        | 24.x            | For containerised deployment        |
| Docker Compose| 2.x             |                                     |
| Xcode         | 15.x            | macOS only, for iOS build           |
| Git           | 2.x             |                                     |

---

## 1. Local Development Setup

### 1.1 Clone and install

```bash
git clone https://github.com/your-org/skyops.git
cd skyops
```

**Backend**

```bash
cd backend
cp .env.example .env        # edit values as needed
npm install
npm run dev                 # starts on http://localhost:3000
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local  # set VITE_API_URL
npm install
npm run dev                 # starts on http://localhost:5173
```

### 1.2 Start MongoDB locally

```bash
# Using Docker (quickest)
docker run -d --name skyops-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=skyops \
  -e MONGO_INITDB_ROOT_PASSWORD=devpassword \
  mongo:6

# Update MONGODB_URI in backend/.env:
# MONGODB_URI=mongodb://skyops:devpassword@localhost:27017/skyops?authSource=admin
```

### 1.3 Seed development data (optional)

```bash
cd backend
npm run seed   # creates sample flights, users, weather entries
```

---

## 2. Docker Deployment

A `docker-compose.yml` is provided in `backend/`.

```bash
cd backend
cp .env.example .env    # fill in production values
docker compose up -d    # starts mongo + backend API
```

**Services started**

| Service  | Port  | Description               |
|----------|-------|---------------------------|
| `api`    | 3000  | SkyOps backend API        |
| `mongo`  | 27017 | MongoDB (not exposed publicly in prod) |

To include the frontend:

```bash
cd frontend
npm run build   # outputs to frontend/dist/

# Serve dist/ with nginx or any static host
```

### 2.1 Building the Docker image manually

```bash
cd backend
docker build -t skyops-api:latest .
docker run -d \
  --env-file .env \
  -p 3000:3000 \
  skyops-api:latest
```

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)

| Variable              | Default                                  | Description                                      |
|-----------------------|------------------------------------------|--------------------------------------------------|
| `PORT`                | `3000`                                   | HTTP listening port                              |
| `NODE_ENV`            | `development`                            | `development` · `production` · `test`           |
| `MONGODB_URI`         | `mongodb://localhost:27017/skyops`       | MongoDB connection string                        |
| `JWT_SECRET`          | *(required)*                             | HS256 signing secret (min 32 chars)              |
| `JWT_EXPIRES_IN`      | `1h`                                     | Access token lifetime                            |
| `REFRESH_TOKEN_SECRET`| *(required)*                             | Separate secret for refresh tokens               |
| `REFRESH_EXPIRES_IN`  | `7d`                                     | Refresh token lifetime                           |
| `ALLOWED_ORIGINS`     | `http://localhost:5173`                  | Comma-separated CORS allowlist                   |
| `RATE_LIMIT_WINDOW_MS`| `900000`                                 | Rate limit window in ms (15 min)                 |
| `RATE_LIMIT_MAX`      | `100`                                    | Max requests per window per IP                   |
| `LOG_LEVEL`           | `info`                                   | Winston log level                                |
| `AVIATION_WX_API_URL` | `https://aviationweather.gov/api`        | Upstream weather data API                        |
| `FAA_NOTAM_API_URL`   | `https://notams.aim.faa.gov/notamSearch` | Upstream NOTAM API                               |

### Frontend (`frontend/.env.local`)

| Variable        | Default                    | Description               |
|-----------------|----------------------------|---------------------------|
| `VITE_API_URL`  | `http://localhost:3000/api`| Backend API base URL      |
| `VITE_APP_NAME` | `SkyOps`                   | Display name in the UI    |

---

## 4. iOS App Build and Deployment

### 4.1 Open the project

```bash
open ios-efb/SkyOps.xcodeproj
```

### 4.2 Configure the API URL

1. In Xcode, select the **SkyOps** target → **Build Settings**.
2. Set `SKYOPS_API_URL` under **User-Defined** settings:
   - Debug:   `http://localhost:3000/api`
   - Release: `https://api.skyops.aero/api`
3. In `Info.plist`, add key `SKYOPS_API_URL` → `$(SKYOPS_API_URL)`.

### 4.3 Code signing

1. Set your **Team** under **Signing & Capabilities**.
2. Update `PRODUCT_BUNDLE_IDENTIFIER` to your reverse-DNS identifier.

### 4.4 Build for device

```bash
xcodebuild \
  -project ios-efb/SkyOps.xcodeproj \
  -scheme SkyOps \
  -destination 'platform=iOS,id=<DEVICE_UDID>' \
  clean build
```

### 4.5 Archive and distribute (App Store / TestFlight)

```bash
xcodebuild archive \
  -project ios-efb/SkyOps.xcodeproj \
  -scheme SkyOps \
  -archivePath ./build/SkyOps.xcarchive

xcodebuild -exportArchive \
  -archivePath ./build/SkyOps.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ./build/SkyOps.ipa
```

---

## 5. Production Deployment (Backend + Frontend)

### 5.1 Backend on a VPS / cloud VM

```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
nvm use 18

# Clone and install
git clone https://github.com/your-org/skyops.git /opt/skyops
cd /opt/skyops/backend
npm ci --omit=dev

# Set up environment
cp .env.example .env
nano .env    # fill in JWT_SECRET, MONGODB_URI, etc.

# Run with PM2
npm install -g pm2
pm2 start src/index.js --name skyops-api
pm2 save
pm2 startup
```

### 5.2 Reverse proxy (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.skyops.aero;

    ssl_certificate     /etc/letsencrypt/live/api.skyops.aero/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.skyops.aero/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 Frontend static hosting

```bash
cd /opt/skyops/frontend
npm ci
VITE_API_URL=https://api.skyops.aero/api npm run build
# Copy dist/ to your CDN / static host (e.g. S3 + CloudFront, Netlify, Vercel)
```

---

## 6. Running Tests

```bash
# Backend unit + integration tests
cd backend
npm test                  # runs Jest with --forceExit
npm run test:coverage     # generates coverage report in coverage/
```

---

## 7. Monitoring and Logging

### Logs

The backend writes structured JSON logs via **Winston**:

```
{"level":"info","message":"GET /api/flights 200 +42ms","ip":"10.0.0.1","timestamp":"..."}
```

- **Local**: logs are written to stdout / stderr. Redirect with `pm2 logs skyops-api`.
- **Production**: pipe to a log aggregator (Datadog, Logtail, CloudWatch) by adding a Winston transport.

### Health check endpoint

```
GET /health
```

Returns JSON with uptime, database state, and app version. Use this with your load balancer or uptime monitor (e.g. UptimeRobot, AWS Route 53 health checks).

### Recommended metrics to track

| Metric                    | Alert threshold        |
|---------------------------|------------------------|
| API p99 response time     | > 2 000 ms             |
| HTTP 5xx error rate       | > 1 %                  |
| MongoDB connection state  | `disconnected`         |
| PM2 process restarts      | > 3 in 10 min          |
| Disk usage (cache dir)    | > 80 %                 |

---

## 8. Troubleshooting

### Backend won't start

- Verify `MONGODB_URI` is reachable: `mongosh "$MONGODB_URI"`
- Check `JWT_SECRET` is set and at least 32 characters.
- Inspect logs: `pm2 logs skyops-api --lines 100`

### CORS errors in browser

- Confirm the frontend origin is in the `ALLOWED_ORIGINS` variable (no trailing slash).

### iOS "App Transport Security" error

- For local development, add `NSAllowsArbitraryLoads` (development only) or configure
  `NSExceptionDomains` for your dev server hostname in `Info.plist`.

### 401 Unauthorized on every request

- The JWT secret may have changed since the token was issued. Log out and back in.
- Verify the backend's `JWT_SECRET` matches what was used to sign the token.

### Slow weather/NOTAM responses

- Check that the upstream API keys (`AVIATION_WX_API_URL`, `FAA_NOTAM_API_URL`) are valid.
- Inspect MongoDB TTL indexes: `db.weathers.getIndexes()`.
