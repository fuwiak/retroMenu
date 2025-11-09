"""
Terrain Builder Scene - 1980s style UI implementation.
Based on the Super Terrain 86 interface design.
"""
import pyxel
from scenes.base_scene import BaseScene
import config
from utils.logger import logger


class TerrainBuilderScene(BaseScene):
    """Scene implementing the Super Terrain 86 interface."""
    
    def __init__(self, state_machine):
        super().__init__(state_machine)
        self.show_instructions = False
        
        # Terrain types
        self.terrain_types = [
            "MOUNTAIN TERRAIN",
            "CITYSCAPE TERRAIN",
            "FOREST TERRAIN",
            "OCEAN TERRAIN"
        ]
        self.selected_terrain = 3  # OCEAN is selected by default
        
        # Current parameter being edited
        self.current_parameter = "TURBULENCE"
        self.parameter_value = 2000  # X-axis marker position
        
        # User info
        self.username = "ARCAN_9022XZPAL"
        self.session_id = "#040/12"
        
        # File info
        self.file_name = "04_LANDFORM/OCEAN"
        self.status = "CREATING_NEW_FILE"
        self.keycode = "KEYCODE_69LY740R6"
        
        # Terrain stats
        self.fluid_shape = "FLUID_SHAPE/39VOL"
        self.flow_point = "FLOW_POINT/12EX"
        self.sublevels = "SUBLEVELS/4"
        
        # Animation frame for wireframe
        self.animation_frame = 0
        
        # Selected folder (A, B, C, D)
        self.selected_folder = 0
        
        # Focus states
        self.focus_mode = "terrain_menu"  # terrain_menu, folders, or export
    
    def enter(self):
        """Called when entering this scene."""
        self.animation_frame = 0
        self.focus_mode = "terrain_menu"
        self.selected_terrain = 3
    
    def exit(self):
        """Called when exiting this scene."""
        pass
    
    def update(self):
        """Handle input and update."""
        self.animation_frame = (self.animation_frame + 1) % 200
        
        # Navigation
        if self.focus_mode == "terrain_menu":
            # Navigate terrain menu
            if pyxel.btnp(pyxel.KEY_UP) or pyxel.btnp(pyxel.KEY_W):
                self.selected_terrain = (self.selected_terrain - 1) % len(self.terrain_types)
            
            if pyxel.btnp(pyxel.KEY_DOWN) or pyxel.btnp(pyxel.KEY_S):
                self.selected_terrain = (self.selected_terrain + 1) % len(self.terrain_types)
            
            # TAB to switch to folders
            if pyxel.btnp(pyxel.KEY_TAB) and not pyxel.btn(pyxel.KEY_SHIFT):
                self.focus_mode = "folders"
            
            # Enter to select
            if pyxel.btnp(pyxel.KEY_RETURN):
                logger.debug(f"Selected terrain: {self.terrain_types[self.selected_terrain]}")
        
        elif self.focus_mode == "folders":
            # Navigate folders (A, B, C, D)
            if pyxel.btnp(pyxel.KEY_LEFT) or pyxel.btnp(pyxel.KEY_A):
                self.selected_folder = (self.selected_folder - 1) % 4
            
            if pyxel.btnp(pyxel.KEY_RIGHT) or pyxel.btnp(pyxel.KEY_D):
                self.selected_folder = (self.selected_folder + 1) % 4
            
            # TAB to switch back or to export
            if pyxel.btnp(pyxel.KEY_TAB):
                if pyxel.btn(pyxel.KEY_SHIFT):
                    self.focus_mode = "terrain_menu"
                else:
                    self.focus_mode = "export"
            
            # Enter to select folder
            if pyxel.btnp(pyxel.KEY_RETURN):
                folder_name = ["A", "B", "C", "D"][self.selected_folder]
                logger.debug(f"Selected folder: {folder_name}")
        
        elif self.focus_mode == "export":
            # TAB to go back to folders
            if pyxel.btnp(pyxel.KEY_TAB) and pyxel.btn(pyxel.KEY_SHIFT):
                self.focus_mode = "folders"
            
            # Enter to export
            if pyxel.btnp(pyxel.KEY_RETURN):
                logger.info("Exporting terrain...")
        
        # ESC to go back to menu
        if pyxel.btnp(pyxel.KEY_ESCAPE):
            try:
                logger.info("ESC pressed - returning to menu")
                self.state_machine.change_state("menu")
            except Exception as e:
                logger.error(f"Error returning to menu: {e}", exc_info=True)
    
    def draw_content(self):
        """Draw the Terrain Builder interface."""
        # Draw all panels
        self._draw_parameter_panel()
        self._draw_geographic_reference_panel()
        self._draw_left_text_elements()
        self._draw_terrain_grid()
        self._draw_terrain_menu()
        self._draw_bottom_stats()
        self._draw_folders()
        self._draw_logo_and_controls()
    
    def _draw_parameter_panel(self):
        """Draw top left panel: Parameter editing."""
        x, y = 8, 8
        w, h = 80, 50
        
        # Panel border
        self._draw_panel(x, y, w, h)
        
        # Title
        pyxel.text(x + 4, y + 4, "EDITING CURRENT", 2)
        pyxel.text(x + 4, y + 12, "PARAMETER:", 2)
        
        # Parameter name box
        param_box_x = x + 4
        param_box_y = y + 20
        param_box_w = 70
        param_box_h = 10
        self._draw_box(param_box_x, param_box_y, param_box_w, param_box_h, 2)
        pyxel.text(param_box_x + 2, param_box_y + 3, self.current_parameter, 3)
        
        # Graph visualization area (simplified)
        graph_x = x + 4
        graph_y = y + 32
        graph_w = 70
        graph_h = 16
        
        # Draw grid pattern
        for i in range(0, graph_w, 8):
            for j in range(0, graph_h, 4):
                pyxel.pset(graph_x + i, graph_y + j, 1)
        
        # Draw wave-like pattern
        import math
        for i in range(graph_w):
            wave_y = int(math.sin((self.animation_frame + i) * 0.1) * 3 + graph_h // 2)
            if 0 <= wave_y < graph_h:
                pyxel.pset(graph_x + i, graph_y + wave_y, 2)
        
        # X-axis labels
        labels = ["1000", "2000", "3000", "4000"]
        label_positions = [0, 20, 40, 60]
        for label, pos in zip(labels, label_positions):
            pyxel.text(graph_x + pos, graph_y + graph_h + 4, label, 2)
        
        # Marker at current value (triangle)
        marker_x = graph_x + 20  # At 2000
        marker_y = graph_y + graph_h + 2
        # Draw triangle using lines
        pyxel.line(marker_x, marker_y, marker_x - 2, marker_y + 3, 3)
        pyxel.line(marker_x, marker_y, marker_x + 2, marker_y + 3, 3)
        pyxel.line(marker_x - 2, marker_y + 3, marker_x + 2, marker_y + 3, 3)
    
    def _draw_geographic_reference_panel(self):
        """Draw top right panel: Geographic Reference."""
        x, y = 100, 8
        w, h = 92, 50
        
        # Panel border
        self._draw_panel(x, y, w, h)
        
        # Icons row
        icon_y = y + 4
        for i, icon_x in enumerate([x + 4, x + 20, x + 36, x + 52]):
            # Simple icon representation
            self._draw_box_border(icon_x, icon_y, 10, 10, 2)
        
        # Geographic Reference label
        pyxel.text(x + 4, icon_y + 14, "GEOGRAPHIC", 2)
        pyxel.text(x + 4, icon_y + 22, "REFERENCE", 2)
        
        # World map outline (simplified)
        map_x = x + 68
        map_y = y + 12
        # Draw simple continent shapes
        # North America
        pyxel.line(map_x, map_y + 8, map_x + 8, map_y + 6, 2)
        pyxel.line(map_x + 8, map_y + 6, map_x + 12, map_y + 10, 2)
        # Europe
        pyxel.line(map_x + 20, map_y + 6, map_x + 18, map_y + 12, 2)
        # Asia
        pyxel.line(map_x + 24, map_y + 8, map_x + 20, map_y + 14, 2)
        
        # User info
        pyxel.text(x + 4, y + 32, f"USER: {self.username}", 2)
        pyxel.text(x + 4, y + 40, "ENTRY CODE: **********", 2)
        pyxel.text(x + 4, y + 48, f"SESSION ID: {self.session_id}", 2)
    
    def _draw_left_text_elements(self):
        """Draw middle left text elements."""
        x, y = 8, 62
        
        # Asterisk
        pyxel.text(x, y, "*", 2)
        
        # File info
        pyxel.text(x + 8, y + 10, self.file_name, 2)
        pyxel.text(x + 8, y + 18, self.status, 3)
        pyxel.text(x + 8, y + 26, self.keycode, 2)
    
    def _draw_terrain_grid(self):
        """Draw 3D wireframe terrain grid in center."""
        center_x = 90
        center_y = 65
        grid_size = 40
        
        # Draw wireframe grid with perspective
        import math
        
        # Grid lines
        for i in range(0, 8):
            # Horizontal lines (back to front)
            y_offset = int(math.sin((self.animation_frame + i * 10) * 0.05) * 5)
            x1 = center_x - grid_size // 2 + i * 6
            y1 = center_y - grid_size // 2 + y_offset
            x2 = center_x + grid_size // 2 - i * 2
            y2 = center_y + grid_size // 2 - y_offset
            
            pyxel.line(x1, y1, x2, y2, 2)
        
        # Vertical lines
        for i in range(0, 8):
            x_offset = int(math.cos((self.animation_frame + i * 10) * 0.05) * 3)
            x = center_x - grid_size // 2 + i * 6 + x_offset
            y_top = center_y - grid_size // 2
            y_bot = center_y + grid_size // 2
            
            pyxel.line(x, y_top, x, y_bot, 2)
    
    def _draw_terrain_menu(self):
        """Draw terrain type selection menu (middle right)."""
        x, y = 140, 60
        w, h = 50, 45
        
        # Chevrons
        pyxel.text(x, y - 4, "<<<", 2)
        
        # Panel border
        self._draw_panel(x, y, w, h)
        
        # Terrain types
        start_y = y + 8
        spacing = 9
        
        for i, terrain in enumerate(self.terrain_types):
            terrain_y = start_y + i * spacing
            
            if i == self.selected_terrain:
                # Highlight selected
                pyxel.rect(x + 2, terrain_y - 2, w - 4, 8, 1)
                pyxel.text(x + 4, terrain_y, terrain, 3)
            else:
                pyxel.text(x + 4, terrain_y, terrain, 2)
            
            # Simple icon (character representation)
            icon = ["^", "[]", "T", "~"][i]
            pyxel.text(x + w - 12, terrain_y, icon, 2)
    
    def _draw_bottom_stats(self):
        """Draw bottom left stats."""
        x, y = 8, 95
        
        pyxel.text(x, y, self.fluid_shape, 2)
        pyxel.text(x, y + 8, self.flow_point, 2)
        pyxel.text(x, y + 16, self.sublevels, 2)
    
    def _draw_folders(self):
        """Draw folder navigation (A, B, C, D)."""
        center_x = 100
        y = 108
        
        folder_labels = ["A", "B", "C", "D"]
        spacing = 25
        
        for i, label in enumerate(folder_labels):
            folder_x = center_x - (spacing * 1.5) + i * spacing
            
            folder_box_x = folder_x - 6
            folder_box_y = y - 4
            folder_box_w = 12
            folder_box_h = 16
            
            if i == self.selected_folder and self.focus_mode == "folders":
                # Highlight selected - draw border
                self._draw_box_border(folder_box_x, folder_box_y, folder_box_w, folder_box_h, 3)
                pyxel.text(folder_x - 2, y, label, 3)
                pyxel.text(folder_x - 2, y + 8, label.lower(), 3)
            else:
                # Folder icon (simple box border)
                self._draw_box_border(folder_box_x, folder_box_y, folder_box_w, folder_box_h, 2)
                pyxel.text(folder_x - 2, y, label, 2)
                pyxel.text(folder_x - 2, y + 8, label.lower(), 2)
            
            # Dots between folders
            if i < len(folder_labels) - 1:
                pyxel.text(folder_x + 8, y, "...", 2)
    
    def _draw_logo_and_controls(self):
        """Draw Super Terrain 86 logo and controls (bottom right)."""
        x, y = 130, 95
        
        # Logo
        pyxel.text(x, y, "SUPER", 2)
        pyxel.text(x, y + 8, "TERRAIN 86", 3)
        
        # Code snippet
        code_y = y + 20
        pyxel.text(x, code_y, "forest.saveToFolder(", 2)
        pyxel.text(x, code_y + 8, "folderNameC);", 2)
        pyxel.text(x, code_y + 16, "var ocean =", 2)
        
        # Controls
        control_y = code_y + 28
        pyxel.text(x, control_y, "000", 2)  # Circles
        pyxel.text(x + 20, control_y, "X ABORT", 11)  # Red X
        pyxel.text(x + 20, control_y + 8, "-> EXPORT", 4)  # Cyan arrow
        
        # Labels
        pyxel.text(x, control_y + 18, "PRODUCT INTERFACE", 2)
        pyxel.text(x, control_y + 26, "LAB TECH (C)1986", 2)
    
    def _draw_panel(self, x, y, w, h):
        """Draw a panel with ASCII-style border."""
        # Border lines
        for px in range(x + 2, x + w - 2):
            pyxel.pset(px, y, 2)  # Top
            pyxel.pset(px, y + h - 1, 2)  # Bottom
        
        for py in range(y, y + h):
            pyxel.pset(x, py, 2)  # Left
            pyxel.pset(x + w - 1, py, 2)  # Right
        
        # Corners
        pyxel.text(x, y, "+", 2)
        pyxel.text(x + w - 4, y, "+", 2)
        pyxel.text(x, y + h - 8, "+", 2)
        pyxel.text(x + w - 4, y + h - 8, "+", 2)
    
    def _draw_box(self, x, y, w, h, color):
        """Draw a filled box with border."""
        pyxel.rect(x, y, w, h, 0)  # Black fill
        self._draw_box_border(x, y, w, h, color)  # Green border
    
    def _draw_box_border(self, x, y, w, h, color):
        """Draw a border around a box."""
        # Top and bottom
        for px in range(x, x + w):
            pyxel.pset(px, y, color)
            pyxel.pset(px, y + h - 1, color)
        # Left and right
        for py in range(y, y + h):
            pyxel.pset(x, py, color)
            pyxel.pset(x + w - 1, py, color)

