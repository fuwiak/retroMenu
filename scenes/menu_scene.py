"""
Main menu scene.
"""
import pyxel
from scenes.base_scene import BaseScene
from ui.components import Title, Panel, Menu
import config


class MenuScene(BaseScene):
    """Main menu screen."""
    
    def __init__(self, state_machine):
        super().__init__(state_machine)
        self.title = Title("VIDEO STATS MENU")
        self.menu_options = ["Video Stats", "Terrain Builder", "Settings", "About", "Quit"]
        self.menu = Menu(
            config.PANEL_MARGIN,
            38,
            self.menu_options
        )
        
        # Calculate panel dimensions
        panel_w = pyxel.width - (config.PANEL_MARGIN * 2)
        panel_h = len(self.menu_options) * config.MENU_OPTION_SPACING + 8
        self.panel = Panel(config.PANEL_MARGIN, 38, panel_w, panel_h)
    
    def enter(self):
        """Reset menu selection when entering."""
        self.menu.selected_index = 0
    
    def exit(self):
        """Called when exiting menu."""
        pass
    
    def update(self):
        """Handle input and update menu."""
        # Update menu animation
        self.menu.update()
        
        # Handle navigation - Arrow keys and TAB
        if pyxel.btnp(pyxel.KEY_UP) or pyxel.btnp(pyxel.KEY_W):
            self.menu.select_previous()
        
        if pyxel.btnp(pyxel.KEY_DOWN) or pyxel.btnp(pyxel.KEY_S):
            self.menu.select_next()
        
        # TAB key navigation (Shift+TAB for previous)
        if pyxel.btnp(pyxel.KEY_TAB):
            if pyxel.btn(pyxel.KEY_SHIFT):
                # Shift+TAB = go to previous
                self.menu.select_previous()
            else:
                # TAB = go to next
                self.menu.select_next()
        
        # Handle selection (Enter/RETURN to confirm)
        if pyxel.btnp(pyxel.KEY_RETURN):
            self._handle_selection()
        
        # ESC on main menu still quits (via Quit option)
        # But if user wants ESC to quit from menu, they can select "Quit" option
    
    def _handle_selection(self):
        """Handle menu option selection."""
        option = self.menu.get_selected()
        
        if option == "Quit":
            pyxel.quit()
        elif option == "Video Stats":
            self.state_machine.change_state("video_stats")
        elif option == "Terrain Builder":
            self.state_machine.change_state("terrain")
        elif option == "Settings":
            print("Opening settings...")
            # Example: self.state_machine.change_state("settings")
        elif option == "About":
            print("About: Video Stats Menu v1.0")
            # Example: self.state_machine.change_state("about")
    
    def draw_content(self):
        """Draw menu-specific content."""
        # Draw title
        self.title.draw()
        
        # Draw menu panel
        self.panel.draw()
        
        # Draw menu options
        self.menu.draw()
        
        # Draw decorative corner elements (1980s terminal style)
        # Simple corner indicators
        pyxel.text(8, 30, ">", 2)  # Green
        pyxel.text(pyxel.width - 12, self.instruction_panel.y - 2, "<", 2)  # Green

