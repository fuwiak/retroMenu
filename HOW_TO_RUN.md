# How to Run RetroMenu Projects

This workspace contains **two separate projects**:

## 1. JavaScript/Vite App (Social Analytics)

**Location:** `retro-terrain/`

**What it is:** A retro-styled social media analytics console (YouTube/VK comments analysis)

**How to run:**
```bash
cd retro-terrain
npm install    # First time only
npm run dev
```

Then open your browser to: **http://localhost:5173**

**Status:** ✅ Currently running in background

---

## 2. Python/Pyxel App (Retro Menu Game)

**Location:** Root directory

**What it is:** A retro menu game built with Pyxel

**How to run:**
```bash
source venv/bin/activate  # Activate virtual environment
python main.py
```

**Note:** Uses Node version 22.12.0 via nvm

---

## Quick Commands

### For JavaScript app:
```bash
cd retro-terrain
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### For Python app:
```bash
source venv/bin/activate
python main.py
```

### Kill running processes:
```bash
# Stop Vite server
pkill -f vite

# Or find and kill manually
ps aux | grep vite
kill [PID]
```

---

## Features

**JavaScript App:**
- YouTube/VK trending analysis
- Comment word frequency analysis
- Video preview
- Export to CSV
- Language filtering

**Python App:**
- State machine-based architecture
- Multiple scenes (Menu, Video Stats, Terrain Builder)
- Retro Pyxel graphics

---

## Docker & Railway Deployment

The Docker setup focuses on the Vite analytics app (`retro-terrain`). The Pyxel game requires a desktop environment and is not containerized for Railway.

### Build and run locally with Docker
```bash
docker build -t retro-terrain .
docker run --rm -p 8080:8080 retro-terrain
```
The site will be available at `http://localhost:8080`.

### Using docker-compose
```bash
docker-compose up --build
```

### Deploying to Railway
1. Push the repository with the new `Dockerfile` **and `railway.toml`** to GitHub.
2. Create a new Railway project using the "Deploy from GitHub" workflow.
3. Railway will build the Docker image automatically (the `railway.toml` forces the Docker builder). Ensure the `PORT` variable is set (default `8080`).
4. After the build succeeds, Railway will expose the generated domain serving the static site.

**Environment variables:** Provide any API keys (e.g., `YT_API_KEY`, `VK_TOKEN`) as Railway environment variables and reference them in the web app or via build-time injection as needed.





