"""
Main entry point for the Retro Menu application.
"""
import sys
from core.game import Game
from scenes.menu_scene import MenuScene
from scenes.video_stats_scene import VideoStatsScene
from scenes.terrain_scene import TerrainBuilderScene
from utils.logger import logger


def main():
    """Initialize and run the game."""
    try:
        logger.info("Starting Retro Menu application")
        game = Game()
        
        # Register scenes
        logger.info("Registering scenes")
        game.add_scene("menu", MenuScene(game.state_machine))
        game.add_scene("video_stats", VideoStatsScene(game.state_machine))
        game.add_scene("terrain", TerrainBuilderScene(game.state_machine))
        # Add more scenes here as you create them:
        # game.add_scene("settings", SettingsScene(game.state_machine))
        # game.add_scene("about", AboutScene(game.state_machine))
        
        # Start with the menu scene
        logger.info("Starting with menu scene")
        game.change_scene("menu")
        
        # Start the game loop
        logger.info("Starting game loop")
        game.run()
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"Critical error in main: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
