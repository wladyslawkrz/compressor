# Web Media Compressor

End-to-end playground for experimenting with image and video compression. The monorepo contains:

- `server`: a NestJS API that transforms single images to WebP, compresses animated GIFs, compresses/crops videos via FFmpeg, and persists processed videos in an S3-compatible bucket (MinIO by default).
- `client`: a Vue 3 single-page app scaffolded with Vite (currently the starter template you can extend into an upload UI).

```text
.
├── client/   # Vue 3 + Vite frontend scaffold
└── server/   # NestJS compression API with MinIO integration
```

## Requirements

- Node.js 20+ and Yarn (`corepack enable` recommended)
- Docker 24+ (for running MinIO via Compose)
- Local `ffmpeg` binary available on your `$PATH`
- Build tooling required by Sharp (Linux: `libvips` provided automatically via npm install)

## Quick Start

1. **Install dependencies**
   ```bash
   cd client && yarn install
   cd ../server && yarn install
   ```

2. **Configure environment**
   Create `/workspace/server/.env` with the values your MinIO/S3 instance expects. Minimum variables:
   ```bash
   PORT=3010
   S3_ENDPOINT=localhost
   S3_API_PORT=9000
   S3_BUCKET=media
   S3_PUBLIC_URL=http://localhost:9000/
   MINIO_ROOT_USER=admin
   MINIO_ROOT_PASSWORD=admin123
   ```

3. **Run MinIO (dev)**
   ```bash
   cd server
   docker compose -f docker-compose.dev.yml up -d
   ```
   - Console: http://localhost:9001
   - API: http://localhost:9000

4. **Start the API**
   ```bash
   cd server
   yarn start:dev
   ```
   - Base URL: `http://localhost:3010/v1`
   - Swagger UI: `http://localhost:3010/v1/api`

5. **Start the client (optional)**
   ```bash
   cd client
   yarn dev --host
   ```
   Visit the Vite dev server output (default http://localhost:5173) and start wiring UI components to the API.

## API Surface

| Method | Path                             | Description | Key query params |
|--------|----------------------------------|-------------|------------------|
| POST   | `/v1/compress/transform-webp`    | Resize + recompress a still image to WebP. | `width`, `height`, `compressionRatio` |
| POST   | `/v1/compress/compress-animated` | Compress animated GIFs into animated WebP. | `compressionRatio` |
| POST   | `/v1/compress/compress-video`    | Compress videos (WebM or MP4) and push to MinIO, returning a pre-signed URL. | `preset`, `width`, `height`, `crf`, `noSound`, `audioBitrate`, `videoBitrate`, `videoFramerate` |
| POST   | `/v1/compress/crop-video`        | Crop a video region and upload the result to MinIO. | `width`, `height`, `x`, `y` |

> All upload endpoints expect `multipart/form-data` with the file field named `image` (for stills/GIFs) or `video`.

### Sample cURL (image → WebP)

```bash
curl -X POST "http://localhost:3010/v1/compress/transform-webp?width=800&compressionRatio=80" \
  -H "accept: application/octet-stream" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/photo.jpg" \
  --output compressed.webp
```

### Sample cURL (video compression)

```bash
curl -X POST "http://localhost:3010/v1/compress/compress-video?preset=MP4&crf=28&noSound=true" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "video=@/path/to/video.mov"
```

The response includes `downloadUrl`, a 24h presigned link emitted by MinIO.

## Development Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `client` | `yarn dev` | Vite dev server with HMR |
|          | `yarn build` | Type-check + production build |
|          | `yarn test:unit` | Vitest component/unit tests |
| `server` | `yarn start:dev` | NestJS dev server with watch mode |
|          | `yarn test` | Jest unit tests |
|          | `yarn lint` | ESLint with auto-fix |

## Storage & Filesystem Notes

- Temporary files live under `server/temp/input` and `server/temp/output`; they are created on-demand and wiped after uploads succeed.
- Still-image transforms emit files under `server/uploads`; ensure the folder exists or grant write permissions to the repo root.
- MinIO bucket creation happens automatically on startup if it does not exist.

## Extending the Client

The Vue scaffold currently renders the default welcome screen. Suggested next steps:

- Replace `HelloWorld.vue` with an upload form that hits the `/compress/**` endpoints.
- Use Pinia to track upload status and show progress bars.
- Surface links returned by the API and offer one-click downloads.

## Troubleshooting

- **Sharp install issues**: ensure Python 3 and build-essential packages are available before running `yarn install` in `server`.
- **FFmpeg errors**: confirm `ffmpeg -version` works on the host or bake it into your container image.
- **MinIO unreachable**: verify `docker compose` is running and that `.env` in `server/` matches the exposed ports.

Happy compressing!
