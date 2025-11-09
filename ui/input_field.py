"""
Input field component for text input.
"""
import pyxel
import config
from utils.logger import logger


class InputField:
    """Simple text input field for URLs."""
    
    def __init__(self, x, y, width, max_length=200):
        self.x = x
        self.y = y
        self.width = width
        self.max_length = max_length
        self.text = ""
        self.cursor_position = 0  # Position of cursor in text
        self.active = False
        self.cursor_blink = 0
        self.clipboard_available = True
        try:
            import pyperclip
            self.pyperclip = pyperclip
        except ImportError:
            self.clipboard_available = False
            self.pyperclip = None
    
    def update(self):
        """Update cursor blink animation."""
        self.cursor_blink = (self.cursor_blink + 1) % 30
    
    def handle_input(self):
        """Handle keyboard input for text entry."""
        if not self.active:
            return
        
        # Handle Ctrl+C (Copy)
        if (pyxel.btn(pyxel.KEY_CTRL) or pyxel.btn(pyxel.KEY_GUI)) and pyxel.btnp(pyxel.KEY_C):
            if self.clipboard_available and self.text:
                try:
                    self.pyperclip.copy(self.text)
                    logger.debug(f"Copied text to clipboard: {len(self.text)} characters")
                except Exception as e:
                    logger.warning(f"Error copying to clipboard: {e}")
            return
        
        # Handle Ctrl+V (Paste)
        if (pyxel.btn(pyxel.KEY_CTRL) or pyxel.btn(pyxel.KEY_GUI)) and pyxel.btnp(pyxel.KEY_V):
            if self.clipboard_available:
                try:
                    clipboard_text = self.pyperclip.paste()
                    if clipboard_text:
                        # Insert clipboard text at cursor position
                        remaining_length = self.max_length - len(self.text)
                        text_to_insert = clipboard_text[:remaining_length]
                        self.text = self.text[:self.cursor_position] + text_to_insert + self.text[self.cursor_position:]
                        self.cursor_position += len(text_to_insert)
                        logger.debug(f"Pasted text from clipboard: {len(text_to_insert)} characters")
                except Exception as e:
                    logger.warning(f"Error pasting from clipboard: {e}")
            return
        
        # Handle Ctrl+A (Select All) - clear and prepare for paste
        if (pyxel.btn(pyxel.KEY_CTRL) or pyxel.btn(pyxel.KEY_GUI)) and pyxel.btnp(pyxel.KEY_A):
            # Select all by clearing (will be replaced on paste)
            self.text = ""
            self.cursor_position = 0
            return
        
        # Handle arrow keys
        if pyxel.btnp(pyxel.KEY_LEFT):
            if self.cursor_position > 0:
                self.cursor_position -= 1
            return
        
        if pyxel.btnp(pyxel.KEY_RIGHT):
            if self.cursor_position < len(self.text):
                self.cursor_position += 1
            return
        
        # Handle Home key - move to start
        if pyxel.btnp(pyxel.KEY_HOME):
            self.cursor_position = 0
            return
        
        # Handle End key - move to end
        if pyxel.btnp(pyxel.KEY_END):
            self.cursor_position = len(self.text)
            return
        
        # Handle backspace
        if pyxel.btnp(pyxel.KEY_BACKSPACE):
            if self.cursor_position > 0:
                # Remove character before cursor
                self.text = self.text[:self.cursor_position - 1] + self.text[self.cursor_position:]
                self.cursor_position -= 1
            return
        
        # Handle Delete key
        if pyxel.btnp(pyxel.KEY_DELETE):
            if self.cursor_position < len(self.text):
                # Remove character at cursor
                self.text = self.text[:self.cursor_position] + self.text[self.cursor_position + 1:]
            return
        
        # Handle character input - letters, numbers, and special chars
        # Map pyxel keys to characters
        key_map = {
            # Letters (lowercase)
            pyxel.KEY_A: 'a', pyxel.KEY_B: 'b', pyxel.KEY_C: 'c', pyxel.KEY_D: 'd',
            pyxel.KEY_E: 'e', pyxel.KEY_F: 'f', pyxel.KEY_G: 'g', pyxel.KEY_H: 'h',
            pyxel.KEY_I: 'i', pyxel.KEY_J: 'j', pyxel.KEY_K: 'k', pyxel.KEY_L: 'l',
            pyxel.KEY_M: 'm', pyxel.KEY_N: 'n', pyxel.KEY_O: 'o', pyxel.KEY_P: 'p',
            pyxel.KEY_Q: 'q', pyxel.KEY_R: 'r', pyxel.KEY_S: 's', pyxel.KEY_T: 't',
            pyxel.KEY_U: 'u', pyxel.KEY_V: 'v', pyxel.KEY_W: 'w', pyxel.KEY_X: 'x',
            pyxel.KEY_Y: 'y', pyxel.KEY_Z: 'z',
            # Numbers
            pyxel.KEY_0: '0', pyxel.KEY_1: '1', pyxel.KEY_2: '2', pyxel.KEY_3: '3',
            pyxel.KEY_4: '4', pyxel.KEY_5: '5', pyxel.KEY_6: '6', pyxel.KEY_7: '7',
            pyxel.KEY_8: '8', pyxel.KEY_9: '9',
            # Special characters
            pyxel.KEY_MINUS: '-', pyxel.KEY_EQUALS: '=', pyxel.KEY_LEFTBRACKET: '[',
            pyxel.KEY_RIGHTBRACKET: ']', pyxel.KEY_SEMICOLON: ';', pyxel.KEY_QUOTE: "'",
            pyxel.KEY_BACKSLASH: '\\', pyxel.KEY_COMMA: ',', pyxel.KEY_PERIOD: '.',
            pyxel.KEY_SLASH: '/', pyxel.KEY_SPACE: ' ', pyxel.KEY_COLON: ':',
        }
        
        # Check if Shift is pressed for uppercase/caps
        shift_pressed = pyxel.btn(pyxel.KEY_SHIFT)
        
        for key, char in key_map.items():
            if pyxel.btnp(key):
                if len(self.text) < self.max_length:
                    # Convert to uppercase if shift is pressed (for letters)
                    if shift_pressed and char.isalpha():
                        char = char.upper()
                    # Special cases for shift+number (for @, #, etc.)
                    if shift_pressed:
                        shift_map = {
                            '2': '@', '3': '#', '4': '$', '5': '%', '6': '^',
                            '7': '&', '8': '*', '9': '(', '0': ')',
                            '-': '_', '=': '+', '[': '{', ']': '}',
                            ';': ':', "'": '"', '\\': '|', ',': '<',
                            '.': '>', '/': '?'
                        }
                        char = shift_map.get(char, char.upper() if char.isalpha() else char)
                    
                    # Insert character at cursor position
                    self.text = self.text[:self.cursor_position] + char + self.text[self.cursor_position:]
                    self.cursor_position += 1
                break
    
    def draw(self):
        """Draw the input field (1980s terminal style)."""
        # Background (black)
        pyxel.rect(self.x, self.y, self.width, 10, 0)  # Black background
        
        # ASCII-style border (green, brighter when active)
        border_color = 3 if self.active else 2  # Bright green if active, dim green if not
        for x in range(self.x + 4, self.x + self.width - 4):
            pyxel.pset(x, self.y, border_color)  # Top
            pyxel.pset(x, self.y + 9, border_color)  # Bottom
        for y in range(self.y, self.y + 10):
            pyxel.pset(self.x, y, border_color)  # Left
            pyxel.pset(self.x + self.width - 1, y, border_color)  # Right
        pyxel.text(self.x, self.y, "+", border_color)  # Corners
        pyxel.text(self.x + self.width - 4, self.y, "+", border_color)
        pyxel.text(self.x, self.y + 2, "+", border_color)
        pyxel.text(self.x + self.width - 4, self.y + 2, "+", border_color)
        
        # Clear button (X) on the right if there's text
        if self.text:
            clear_btn_x = self.x + self.width - 12
            clear_btn_y = self.y + 1
            # Dark green background for X button
            pyxel.rect(clear_btn_x, clear_btn_y, 10, 8, 1)  # Dark green background
            for x in range(clear_btn_x, clear_btn_x + 10):
                pyxel.pset(x, clear_btn_y, border_color)
                pyxel.pset(x, clear_btn_y + 7, border_color)
            for y in range(clear_btn_y, clear_btn_y + 8):
                pyxel.pset(clear_btn_x, y, border_color)
                pyxel.pset(clear_btn_x + 9, y, border_color)
            pyxel.text(clear_btn_x + 3, self.y + 3, "X", 11)  # Red X
        
        # Text (green terminal style)
        # Calculate which part of text to display based on cursor position
        max_visible_chars = (self.width - 16) // 4  # Reserve space for clear button
        display_start = 0
        
        if len(self.text) > max_visible_chars:
            # Show cursor in visible area
            if self.cursor_position > max_visible_chars - 3:
                display_start = self.cursor_position - max_visible_chars + 3
                if display_start > len(self.text) - max_visible_chars:
                    display_start = len(self.text) - max_visible_chars
        
        display_text = self.text[display_start:display_start + max_visible_chars]
        if display_start > 0:
            display_text = "..." + display_text
        
        pyxel.text(self.x + 2, self.y + 2, display_text, border_color)  # Green text
        
        # Blinking cursor (green underscore style) - position based on cursor_position
        if self.active and self.cursor_blink < 15:
            visible_cursor_pos = self.cursor_position - display_start
            if display_start > 0:
                visible_cursor_pos += 3  # Account for "..."
            cursor_x = self.x + 2 + visible_cursor_pos * 4
            pyxel.line(cursor_x, self.y + 8, cursor_x + 3, self.y + 8, border_color)
    
    def set_active(self, active):
        """Set whether the input field is active."""
        self.active = active
    
    def get_text(self):
        """Get the current text."""
        return self.text
    
    def clear(self):
        """Clear the input field."""
        self.text = ""
        self.cursor_position = 0

