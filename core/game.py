"""
Main game engine class.
"""
import pyxel
from .state_machine import StateMachine
import config
from utils.logger import logger


class Game:
    """Main game class that manages the game loop and state machine."""
    
    def __init__(self):
        # Initialize Pyxel
        # Set quit_key to None to prevent ESC from quitting the app
        pyxel.init(
            config.WINDOW_WIDTH,
            config.WINDOW_HEIGHT,
            title=config.WINDOW_TITLE,
            fps=config.FPS,
            quit_key=pyxel.KEY_NONE  # Disable ESC as quit key - we handle it ourselves
        )
        
        # Initialize color palette
        self._init_colors()
        
        # Initialize state machine
        self.state_machine = StateMachine()
    
    def run(self):
        """Start the game loop."""
        pyxel.run(self.update, self.draw)
    
    def _init_colors(self):
        """Initialize the color palette with 1980s Terrain Builder style."""
        color_list = [
            config.COLORS['BLACK'],
            config.COLORS['DARK_GREEN'],
            config.COLORS['GREEN'],          # Primary CRT green
            config.COLORS['BRIGHT_GREEN'],   # Highlight green
            config.COLORS['CYAN'],           # Accent
            config.COLORS['DARK_GRAY'],
            config.COLORS['GRAY'],
            config.COLORS['LIGHT_GRAY'],
            config.COLORS['WHITE'],
            config.COLORS['YELLOW'],         # Warnings
            config.COLORS['ORANGE'],         # Errors
            config.COLORS['RED'],            # Critical
            config.COLORS['BLUE'],           # Accent
            config.COLORS['MAGENTA'],        # Accent
            config.COLORS['DARK_BLUE'],
            config.COLORS['DARK_CYAN'],
        ]
        for i, color in enumerate(color_list):
            pyxel.colors[i] = color
    
    def update(self):
        """Update game logic."""
        try:
            self.state_machine.update()
        except Exception as e:
            logger.error(f"Error in game update: {e}", exc_info=True)
    
    def draw(self):
        """Draw game frame."""
        try:
            pyxel.cls(0)  # Clear with black background
            self.state_machine.draw()
        except Exception as e:
            logger.error(f"Error in game draw: {e}", exc_info=True)
    
    def add_scene(self, name: str, scene):
        """Add a scene to the state machine."""
        self.state_machine.add_state(name, scene)
    
    def change_scene(self, name: str):
        """Change to a different scene."""
        self.state_machine.change_state(name)

