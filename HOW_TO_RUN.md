# How to Run RetroMenu Projects

This workspace now consists of:

## 1. JavaScript/Vite App (Social Analytics)

**Location:** `retro-terrain/`

**What it is:** A retro-styled social media analytics console (YouTube/VK comments analysis)

**How to run:**
```bash
cd retro-terrain
npm install    # First time only
npm run dev
```

Create a `.env` (or `.env.local`) from `retro-terrain/.env.example` and provide required API keys (e.g. `VITE_YOUTUBE_API_KEY`).

Then open your browser to: **http://localhost:5173**

---

## 2. Python Utilities (CLI scripts)

**Location:** project root (e.g. `advanced_social_stats.py`, `daily_views_report.py`)

**How to use:**
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python advanced_social_stats.py --help
```

Install only the dependencies you need for the utility you run.

---

## Quick Commands

### JavaScript app
```bash
cd retro-terrain
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Python utilities
```bash
source .venv/bin/activate
python advanced_social_stats.py --help
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

**Python Utilities:**
- Social media statistics collection (YouTube, VK, Instagram)
- Daily view reports
- Telegram bot integrations

---

## Docker & Railway Deployment

The Docker setup focuses on the Vite analytics app (`retro-terrain`). CLI utilities are run locally and are not containerised.

### Build and run locally with Docker
```bash
docker build -t retro-terrain . \
  --build-arg VITE_YOUTUBE_API_KEY=your_key \
  --build-arg VITE_VK_TOKEN=optional_vk_token
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





