# Kassa API

Backend service for Kassa AI-driven furniture search.

## Tech Stack
- **Runtime**: Node.js (v20+)
- **Framework**: Fastify
- **Database**: MongoDB
- **AI**: Google Gemini (Vision & Reranking)

## Setup

### 1. Environment Variables
Create a `.env` file in this directory:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/kassa
ADMIN_TOKEN=your-secret-token
CORS_ORIGIN=*
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Seed Database
To populate the catalog with demo furniture data:
```bash
pnpm seed
```

## Running the Application

### Development
```bash
pnpm dev
```

### Production (Build & Start)
```bash
pnpm build
pnpm start
```

### Docker
```bash
docker build -t kassa-api -f Dockerfile ../../
docker run -p 4000:4000 --env-file .env kassa-api
```

## API Quick Reference

### Search
- **Endpoint**: `POST /api/search`
- **Auth**: Header `x-ai-api-key: <gemini-api-key>`
- **Body**: `multipart/form-data`
  - `image`: Image file (JPEG/PNG/WebP)
  - `prompt`: String (Optional instructions)

### Admin
All admin routes require Header `x-admin-token: <ADMIN_TOKEN>`.
- `GET /api/admin/config`: Get current tuning parameters.
- `PATCH /api/admin/config`: Update parameters (volatile).
- `POST /api/admin/config/reset`: Reset to defaults.
- `GET /api/admin/telemetry`: View recent search performance.

## Security
- **API Keys**: Stored in-memory only (per request).
- **Rate Limiting**: Enforced per IP.
- **Uploads**: Magic byte validation and size limits.
- **Admin**: Protected by token gate.
