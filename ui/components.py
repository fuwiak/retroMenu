"""
Reusable UI components for the retro menu.
"""
import pyxel
import config


class UIComponent:
    """Base class for UI components."""
    
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def draw(self):
        """Draw the component."""
        pass


class Border(UIComponent):
    """Draws a decorative border around the screen."""
    
    def __init__(self):
        super().__init__(0, 0)
    
    def draw(self):
        """Draw ASCII-style border (1980s Terrain Builder style)."""
        # Simple single-line border with ASCII corners
        w = pyxel.width - 1
        h = pyxel.height - 1
        
        # Draw border using lines (ASCII art style)
        # Top and bottom lines
        for x in range(2, w - 1):
            pyxel.pset(x, 2, 2)  # Green
            pyxel.pset(x, h - 2, 2)  # Green
        
        # Left and right lines
        for y in range(2, h - 1):
            pyxel.pset(2, y, 2)  # Green
            pyxel.pset(w - 2, y, 2)  # Green
        
        # Corner characters (ASCII style)
        pyxel.text(2, 2, "+", 2)  # Green
        pyxel.text(w - 6, 2, "+", 2)  # Green
        pyxel.text(2, h - 10, "+", 2)  # Green
        pyxel.text(w - 6, h - 10, "+", 2)  # Green


class Title(UIComponent):
    """Displays a title with shadow and decorative lines."""
    
    def __init__(self, text, y=10):
        super().__init__(0, y)
        self.text = text
    
    def draw(self):
        """Draw title in 1980s terminal style."""
        title_x = (pyxel.width - len(self.text) * 4) // 2
        
        # Main title (bright green CRT style)
        pyxel.text(title_x, self.y, self.text, 3)  # Bright green
        
        # Simple underline (ASCII style)
        line_y = self.y + 10
        for x in range(title_x - 4, title_x + len(self.text) * 4 + 4):
            if x >= 4 and x < pyxel.width - 4:
                pyxel.pset(x, line_y, 2)  # Green line


class Panel(UIComponent):
    """Draws a panel with background and border."""
    
    def __init__(self, x, y, width, height):
        super().__init__(x, y)
        self.width = width
        self.height = height
    
    def draw(self):
        """Draw panel with ASCII-style border (1980s Terrain Builder)."""
        # Background (black)
        pyxel.rect(self.x, self.y, self.width, self.height, 0)  # Black background
        
        # ASCII-style border with corner characters
        # Top line
        for x in range(self.x + 4, self.x + self.width - 4):
            pyxel.pset(x, self.y, 2)  # Green
        # Bottom line
        for x in range(self.x + 4, self.x + self.width - 4):
            pyxel.pset(x, self.y + self.height - 1, 2)  # Green
        # Left line
        for y in range(self.y, self.y + self.height):
            pyxel.pset(self.x, y, 2)  # Green
        # Right line
        for y in range(self.y, self.y + self.height):
            pyxel.pset(self.x + self.width - 1, y, 2)  # Green
        
        # Corner characters
        pyxel.text(self.x, self.y, "+", 2)  # Top-left
        pyxel.text(self.x + self.width - 4, self.y, "+", 2)  # Top-right
        pyxel.text(self.x, self.y + self.height - 8, "+", 2)  # Bottom-left
        pyxel.text(self.x + self.width - 4, self.y + self.height - 8, "+", 2)  # Bottom-right


class Menu(UIComponent):
    """A menu component that displays selectable options."""
    
    def __init__(self, x, y, options, selected_index=0):
        super().__init__(x, y)
        self.options = options
        self.selected_index = selected_index
        self.animation_frame = 0
        self.width = pyxel.width - (x * 2)
        self.height = len(options) * config.MENU_OPTION_SPACING + 8
    
    def update(self):
        """Update animation frame."""
        self.animation_frame = (self.animation_frame + 1) % config.ANIMATION_SPEED
    
    def select_next(self):
        """Select next option."""
        self.selected_index = (self.selected_index + 1) % len(self.options)
    
    def select_previous(self):
        """Select previous option."""
        self.selected_index = (self.selected_index - 1) % len(self.options)
    
    def get_selected(self):
        """Get the currently selected option."""
        return self.options[self.selected_index]
    
    def draw(self):
        """Draw menu options."""
        start_y = self.y + 8
        option_x = self.x + config.PANEL_INNER_PADDING
        
        for i, option in enumerate(self.options):
            y = start_y + i * config.MENU_OPTION_SPACING
            
            if i == self.selected_index:
                # Pulsing color for selected item (terminal green pulse)
                pulse = int((self.animation_frame / 30.0) * 3) % 3
                highlight_color = config.PULSE_COLORS[pulse]  # Green variants
                
                # Draw selection indicator (ASCII style)
                box_y = y - 2
                box_h = 11
                # Invert background (dark green/black)
                pyxel.rect(option_x - 4, box_y, self.width - 16, box_h, 1)  # Dark green background
                
                # Draw ASCII arrow indicator
                pyxel.text(option_x - 2, y, ">", highlight_color)
                pyxel.text(option_x + self.width - 20, y, "<", highlight_color)
                
                # Draw option text (bright green for selected)
                pyxel.text(option_x + 8, y, option, highlight_color)  # Bright green text
                
                # Blinking cursor effect
                if self.animation_frame % 30 < 15:
                    pyxel.pset(option_x + 6 + len(option) * 4, y + 2, highlight_color)
            else:
                # Draw option text in dim green for non-selected
                pyxel.text(option_x + 8, y, option, 2)  # Dim green text


class InstructionPanel(UIComponent):
    """Displays control instructions at the bottom of the screen."""
    
    def __init__(self, y=None):
        if y is None:
            y = pyxel.height - 28
        super().__init__(10, y)
        self.width = pyxel.width - 20
        self.height = 18
    
    def draw(self):
        """Draw instruction panel (1980s terminal style)."""
        # Panel background (black)
        pyxel.rect(self.x, self.y, self.width, self.height, 0)  # Black
        
        # ASCII-style border
        for x in range(self.x + 4, self.x + self.width - 4):
            pyxel.pset(x, self.y, 2)  # Green top
            pyxel.pset(x, self.y + self.height - 1, 2)  # Green bottom
        for y in range(self.y, self.y + self.height):
            pyxel.pset(self.x, y, 2)  # Green left
            pyxel.pset(self.x + self.width - 1, y, 2)  # Green right
        pyxel.text(self.x, self.y, "+", 2)  # Corners
        pyxel.text(self.x + self.width - 4, self.y, "+", 2)
        pyxel.text(self.x, self.y + self.height - 8, "+", 2)
        pyxel.text(self.x + self.width - 4, self.y + self.height - 8, "+", 2)
        
        # Instructions text (green terminal style)
        pyxel.text(self.x + 8, self.y + 4, "[ARROWS] [TAB]", 2)  # Green
        pyxel.text(self.x + 8, self.y + 12, "[ENTER] Select", 2)  # Green
        pyxel.text(self.x + self.width - 80, self.y + 4, "NAVIGATE", 4)  # Cyan
        pyxel.text(self.x + self.width - 80, self.y + 12, "CONFIRM", 4)  # Cyan


