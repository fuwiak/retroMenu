"""
Base scene class that all game scenes inherit from.
"""
from abc import ABC, abstractmethod
from core.state_machine import State
import pyxel
from ui.components import Border, InstructionPanel


class BaseScene(State, ABC):
    """Base class for all game scenes."""
    
    def __init__(self, state_machine):
        super().__init__(state_machine)
        self.border = Border()
        self.instruction_panel = InstructionPanel()
        self.show_instructions = True
    
    def enter(self):
        """Called when entering this scene."""
        pass
    
    def exit(self):
        """Called when exiting this scene."""
        pass
    
    def draw(self):
        """Default draw method that draws common elements."""
        # Draw border
        self.border.draw()
        
        # Draw scene-specific content
        self.draw_content()
        
        # Draw instructions if enabled
        if self.show_instructions:
            self.instruction_panel.draw()
    
    @abstractmethod
    def draw_content(self):
        """Draw scene-specific content. Must be implemented by subclasses."""
        pass

