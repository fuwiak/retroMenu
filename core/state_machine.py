"""
State Machine implementation for managing different game scenes.
"""
from abc import ABC, abstractmethod
import pyxel
from utils.logger import logger


class State(ABC):
    """Base class for all game states/scenes."""
    
    def __init__(self, state_machine):
        self.state_machine = state_machine
    
    @abstractmethod
    def enter(self):
        """Called when entering this state."""
        pass
    
    @abstractmethod
    def exit(self):
        """Called when exiting this state."""
        pass
    
    @abstractmethod
    def update(self):
        """Update logic for this state."""
        pass
    
    @abstractmethod
    def draw(self):
        """Draw logic for this state."""
        pass


class StateMachine:
    """Manages state transitions and delegates update/draw calls."""
    
    def __init__(self):
        self.states = {}
        self.current_state = None
        self.next_state = None
    
    def add_state(self, name: str, state: State):
        """Register a state with the state machine."""
        self.states[name] = state
    
    def change_state(self, name: str):
        """Transition to a new state."""
        try:
            if name not in self.states:
                error_msg = f"State '{name}' not found. Available states: {list(self.states.keys())}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            logger.debug(f"Changing state to: {name}")
            self.next_state = name
        except Exception as e:
            logger.error(f"Error changing state to '{name}': {e}", exc_info=True)
            raise
    
    def update(self):
        """Update current state and handle transitions."""
        try:
            # Handle state transition
            if self.next_state:
                if self.current_state:
                    try:
                        self.current_state.exit()
                    except Exception as e:
                        logger.error(f"Error exiting state: {e}", exc_info=True)
                
                try:
                    self.current_state = self.states[self.next_state]
                    self.current_state.enter()
                    logger.info(f"Entered state: {self.next_state}")
                except Exception as e:
                    logger.error(f"Error entering state '{self.next_state}': {e}", exc_info=True)
                    # Fallback to menu if available
                    if 'menu' in self.states:
                        self.current_state = self.states['menu']
                        self.current_state.enter()
                finally:
                    self.next_state = None
            
            # Update current state
            if self.current_state:
                try:
                    self.current_state.update()
                except Exception as e:
                    logger.error(f"Error updating state: {e}", exc_info=True)
        except Exception as e:
            logger.critical(f"Critical error in state machine update: {e}", exc_info=True)
    
    def draw(self):
        """Draw current state."""
        if self.current_state:
            self.current_state.draw()
    
    def get_current_state_name(self):
        """Get the name of the current state."""
        for name, state in self.states.items():
            if state == self.current_state:
                return name
        return None


