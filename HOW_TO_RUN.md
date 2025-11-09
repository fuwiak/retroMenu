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





