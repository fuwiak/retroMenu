# Retro Menu Toolkit

This repository now focuses on two areas:
- **Retro Analytics Web App** (`retro-terrain/`): a Vite-based interface for social analytics.
- **Python utilities** (`advanced_social_stats.py`, `daily_views_report.py`, etc.) for data collection and reporting.

## Project Structure

```
retroMenu/
├── advanced_social_stats.py   # YouTube/VK/Instagram data fetcher
├── daily_views_report.py      # CLI report generator
├── retro-terrain/             # Vite project for the retro analytics UI
├── requirements.txt           # Python dependencies for CLI tools
├── telegram_bot.py            # Telegram integrations
├── utils/                     # (removed)
└── ...                        # Additional scripts
```

## Front-end (Vite) App
- Located in `retro-terrain/`
- Uses Vite + vanilla JS modules
- Provides trending fetchers, comment analysis and CSV exports
- Deployment is containerised via the root `Dockerfile`
- Provide API tokens via `.env` in `retro-terrain/` (see `.env.example`)

### Local development
```bash
cd retro-terrain
npm install
npm run dev
```
The site is served on `http://localhost:5173` by default.

### Production build
```bash
cd retro-terrain
npm run build
npm run preview
```

## Python Utilities
Install dependencies inside a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Use individual scripts as needed, for example:
```bash
python advanced_social_stats.py --help
```

## Docker / Railway Deployment
The repository ships with a multistage `Dockerfile` that builds the Vite app and serves static assets with `serve`. A `railway.toml` ensures Railway uses the Docker builder.

```bash
docker build -t retro-terrain .
docker run --rm -p 8080:8080 retro-terrain
```

For Railway:
1. Push the repo with the Dockerfile and railway config.
2. Set `PORT=8080` (or another value) in Railway variables.
3. Redeploy to obtain a public domain.

---

The Pyxel/desktop game has been removed to keep the focus on the analytics tooling and web interface.


