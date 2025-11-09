"""
Configuration module for the Retro Menu application.
Contains all configurable settings, colors, and constants.
"""

# Window settings
WINDOW_WIDTH = 200
WINDOW_HEIGHT = 140
WINDOW_TITLE = "Retro Menu"
FPS = 60

# Color palette (1980s Terrain Builder style - monochrome/terminal)
COLORS = {
    'BLACK': 0x000000,           # Black background
    'DARK_GREEN': 0x003300,      # Dark green
    'GREEN': 0x00FF00,           # Bright green (CRT green)
    'BRIGHT_GREEN': 0x88FF88,    # Bright green highlight
    'CYAN': 0x00FFFF,            # Cyan accent
    'DARK_GRAY': 0x222222,       # Dark gray
    'GRAY': 0x666666,            # Medium gray
    'LIGHT_GRAY': 0xAAAAAA,      # Light gray
    'WHITE': 0xFFFFFF,           # White (rarely used)
    'YELLOW': 0xFFFF00,          # Yellow for warnings
    'ORANGE': 0xFF8800,          # Orange for errors
    'RED': 0xFF0000,             # Red for critical
    'BLUE': 0x0088FF,            # Blue accent
    'MAGENTA': 0xFF00FF,         # Magenta accent
    'DARK_BLUE': 0x000088,       # Dark blue
    'DARK_CYAN': 0x008888,       # Dark cyan
}

# UI Settings
MENU_OPTION_SPACING = 18
ANIMATION_SPEED = 60
PULSE_COLORS = [2, 3, 4]  # Green, Bright Green, Cyan (terminal colors)

# Terrain Builder 1980s color indices mapping
BLACK = 0
DARK_GREEN = 1
GREEN = 2               # Primary CRT green
BRIGHT_GREEN = 3        # Highlight green
CYAN = 4                # Accent color
DARK_GRAY = 5
GRAY = 6
LIGHT_GRAY = 7
WHITE = 8
YELLOW = 9              # Warnings
ORANGE = 10             # Errors
RED = 11                # Critical
BLUE = 12               # Accent
MAGENTA = 13            # Accent
DARK_BLUE = 14
DARK_CYAN = 15

# Input keys
KEYS = {
    'UP': ['UP', 'W'],
    'DOWN': ['DOWN', 'S'],
    'SELECT': ['SPACE', 'Z'],
    'BACK': ['ESCAPE', 'Q'],
}

# Menu panel settings
PANEL_MARGIN = 30
PANEL_INNER_PADDING = 12


