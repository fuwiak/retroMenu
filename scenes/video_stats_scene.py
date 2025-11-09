"""
Video stats scene for displaying video statistics.
"""
import pyxel
from scenes.base_scene import BaseScene
from ui.components import Title, Panel
from ui.input_field import InputField
import config
from utils.logger import logger

try:
    from advanced_social_stats import AdvancedSocialStatsChecker
    STATS_AVAILABLE = True
except ImportError:
    STATS_AVAILABLE = False


class VideoStatsScene(BaseScene):
    """Scene for displaying video statistics."""
    
    def __init__(self, state_machine):
        super().__init__(state_machine)
        self.show_instructions = False
        
        # Input field - adjusted position to align with label
        self.input_field = InputField(50, 35, pyxel.width - 70, max_length=200)
        self.input_field.set_active(True)
        
        # Stats data
        self.current_stats = None
        self.loading = False
        self.error_message = None
        
        # Initialize stats checker if available (lazy initialization)
        self.stats_checker = None
        self._stats_initialized = False
    
    def enter(self):
        """Called when entering this scene."""
        self.input_field.clear()
        self.input_field.set_active(True)
        self.current_stats = None
        self.error_message = None
    
    def exit(self):
        """Called when exiting this scene."""
        self.input_field.set_active(False)
    
    def update(self):
        """Handle input and update."""
        # Handle Tab key - focus on input field (if not already focused)
        if pyxel.btnp(pyxel.KEY_TAB):
            if not self.input_field.active:
                self.input_field.set_active(True)
                logger.debug("Input field focused via Tab")
        
        # Update input field
        self.input_field.update()
        self.input_field.handle_input()
        
        # Check for Delete key to clear input (when not typing)
        if pyxel.btnp(pyxel.KEY_DELETE) and not self.input_field.active:
            self.input_field.clear()
            logger.debug("Cleared input field via Delete key")
        
        # Check for clear button click (X button) - mouse click
        # Use btnr (button released) for better click detection
        if pyxel.btnr(pyxel.MOUSE_BUTTON_LEFT):
            mouse_x = pyxel.mouse_x
            mouse_y = pyxel.mouse_y
            # Check if click is on clear button (X)
            if self.input_field.get_text():
                clear_btn_x = self.input_field.x + self.input_field.width - 12
                clear_btn_y = self.input_field.y + 1
                clear_btn_w = 10
                clear_btn_h = 8
                
                # Check if mouse click is within clear button bounds
                if (clear_btn_x <= mouse_x <= clear_btn_x + clear_btn_w and 
                    clear_btn_y <= mouse_y <= clear_btn_y + clear_btn_h):
                    self.input_field.clear()
                    logger.debug(f"Cleared input field via clear button (clicked at {mouse_x}, {mouse_y})")
        
        # Check for Enter (RETURN) to fetch stats
        if pyxel.btnp(pyxel.KEY_RETURN):
            url = self.input_field.get_text().strip()
            if url:
                self._fetch_stats(url)
        
        # Check for Escape to go back
        if pyxel.btnp(pyxel.KEY_ESCAPE):
            try:
                logger.info("ESC pressed - returning to menu")
                self.state_machine.change_state("menu")
            except Exception as e:
                logger.error(f"Error returning to menu from ESC: {e}", exc_info=True)
                # Try to handle gracefully - just reset to menu state
                try:
                    if "menu" in self.state_machine.states:
                        self.state_machine.next_state = "menu"
                except Exception as e2:
                    logger.critical(f"Critical error handling ESC: {e2}", exc_info=True)
    
    def _ensure_stats_checker(self):
        """Lazy initialization of stats checker."""
        if self._stats_initialized:
            return
        
        self._stats_initialized = True
        
        if STATS_AVAILABLE:
            try:
                logger.info("Initializing AdvancedSocialStatsChecker...")
                self.stats_checker = AdvancedSocialStatsChecker()
                logger.info("AdvancedSocialStatsChecker initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing stats checker: {e}", exc_info=True)
                self.stats_checker = None
        else:
            logger.warning("Stats modules not available - imports failed")
    
    def _fetch_stats(self, url):
        """Fetch video statistics for the given URL."""
        try:
            logger.info(f"Fetching stats for URL: {url}")
            
            # Lazy initialization
            self._ensure_stats_checker()
            
            if not STATS_AVAILABLE or not self.stats_checker:
                error_msg = "Stats checker not available"
                logger.warning(error_msg)
                self.error_message = error_msg
                return
            
            self.loading = True
            self.error_message = None
            self.current_stats = None
            
            try:
                # Determine platform and get stats
                url_lower = url.lower()
                
                if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
                    # YouTube video or short
                    if '/shorts/' in url_lower:
                        self.current_stats = self.stats_checker.get_youtube_short_data(url)
                    else:
                        # Regular YouTube videos not supported - only Shorts are available
                        self.error_message = "Only YouTube Shorts are supported. Use a YouTube Shorts URL instead."
                
                elif 'instagram.com' in url_lower:
                    # Instagram Reel
                    reel_data = self.stats_checker.get_instagram_reel_data(url)
                    if reel_data and 'error' not in reel_data:
                        self.current_stats = reel_data
                    else:
                        self.error_message = reel_data.get('error', 'Unknown error') if reel_data else "Failed to fetch"
                
                elif 'vk.com' in url_lower:
                    # VK Clip - ensure URL is properly formatted
                    url = url.strip()
                    logger.debug(f"Processing VK URL: {url}")
                    clip_data = self.stats_checker.get_vk_clip_data(url)
                    if clip_data and 'error' not in clip_data:
                        # Extract clip data for display
                        clips = clip_data.get('clips', [])
                        if clips:
                            clip = clips[0]
                            # Format for display
                            self.current_stats = {
                                'platform': 'VK',
                                'url': url,
                                'video_id': clip.get('video_id', ''),
                                'title': clip.get('title', ''),
                                'views': clip.get('views', 0),
                                'likes': clip.get('likes', 0),
                                'comments': clip.get('comments', 0),
                                'published_at': clip.get('date', ''),
                                'duration': clip.get('duration', 0),
                                'method': clip_data.get('method', 'VK API')
                            }
                            logger.info(f"✅ VK clip stats retrieved: {self.current_stats}")
                        else:
                            self.error_message = "No clip data found"
                    else:
                        self.error_message = clip_data.get('error', 'Unknown error') if clip_data else "Failed to fetch"
                
                else:
                    self.error_message = "Unsupported platform"
            
            except Exception as e:
                error_msg = f"Error: {str(e)[:50]}"
                logger.error(f"Error fetching stats for {url}: {e}", exc_info=True)
                self.error_message = error_msg
                self.current_stats = None
            finally:
                self.loading = False
        except Exception as e:
            logger.critical(f"Critical error in _fetch_stats: {e}", exc_info=True)
            self.error_message = "Critical error occurred"
            self.loading = False
    
    def draw_content(self):
        """Draw video stats content."""
        # Title
        title = Title("VIDEO STATS", y=8)
        title.draw()
        
        # URL input label (green terminal text)
        pyxel.text(20, 35, "URL:", 2)  # Green
        
        # Input field
        self.input_field.draw()
        
        # Status messages (terminal green/yellow/red)
        if self.loading:
            pyxel.text(20, 64, "LOADING...", 4)  # Cyan
        elif self.error_message:
            error_display = self.error_message[:30]  # Limit length
            pyxel.text(20, 64, f"ERROR: {error_display}", 11)  # Red
        elif self.current_stats:
            # Display stats
            self._draw_stats(self.current_stats)
        
        # Instructions (terminal green style) - more compact
        pyxel.text(20, pyxel.height - 32, "[ENTER] FETCH", 2)  # Green
        pyxel.text(20, pyxel.height - 22, "[ESC] BACK", 2)  # Green
        pyxel.text(20, pyxel.height - 12, "[TAB] FOCUS [ARROWS] NAVIGATE", 2)  # Green - navigation hints
    
    def _draw_stats(self, stats):
        """Draw video statistics (1980s terminal style - green/cyan on black)."""
        y = 72
        LINE_SPACING = 12  # Increased spacing between lines
        LABEL_X = 20
        VALUE_X = 80  # Fixed position for values to avoid overlap
        
        # Platform (green label, cyan value)
        platform = stats.get('platform', 'Unknown')
        pyxel.text(LABEL_X, y, "PLATFORM:", 2)  # Green label
        pyxel.text(VALUE_X, y, platform.upper(), 4)  # Cyan value
        y += LINE_SPACING
        
        # Title or video_id (green label, bright green value)
        if 'title' in stats and stats['title']:
            title = stats['title']
            # Fit title to available width
            max_title_len = 28
            if len(title) > max_title_len:
                title = title[:max_title_len - 3] + "..."
            pyxel.text(LABEL_X, y, "TITLE:", 2)  # Green label
            pyxel.text(VALUE_X, y, title.upper(), 3)  # Bright green value
            y += LINE_SPACING
        
        # Views (green label, cyan value)
        if 'views' in stats:
            views = stats['views']
            views_str = f"{views:,}" if isinstance(views, int) else str(views)
            pyxel.text(LABEL_X, y, "VIEWS:", 2)  # Green label
            pyxel.text(VALUE_X, y, views_str, 4)  # Cyan value
            y += LINE_SPACING
        
        # Likes (green label, yellow value)
        if 'likes' in stats:
            likes = stats['likes']
            if likes > 0:
                likes_str = f"{likes:,}" if isinstance(likes, int) else str(likes)
                pyxel.text(LABEL_X, y, "LIKES:", 2)  # Green label
                pyxel.text(VALUE_X, y, likes_str, 9)  # Yellow value
                y += LINE_SPACING
        
        # Comments (green label, green value)
        if 'comments' in stats:
            comments = stats['comments']
            if comments > 0:
                comments_str = f"{comments:,}" if isinstance(comments, int) else str(comments)
                pyxel.text(LABEL_X, y, "COMMENTS:", 2)  # Green label
                pyxel.text(VALUE_X, y, comments_str, 3)  # Bright green value
                y += LINE_SPACING
        
        # Published date (green label, cyan value)
        if 'published_at' in stats and stats['published_at']:
            date = stats['published_at']
            if len(date) > 10:
                date = date[:10]  # Just the date part
            pyxel.text(LABEL_X, y, "DATE:", 2)  # Green label
            pyxel.text(VALUE_X, y, date, 4)  # Cyan value
            y += LINE_SPACING
        
        # Duration (if available)
        if 'duration' in stats and stats.get('duration', 0) > 0:
            duration = stats['duration']
            duration_str = f"{duration}s" if duration < 60 else f"{duration // 60}m {duration % 60}s"
            pyxel.text(LABEL_X, y, "DURATION:", 2)  # Green label
            pyxel.text(VALUE_X, y, duration_str, 4)  # Cyan value
            y += LINE_SPACING
        
        # Video ID (green label, green value)
        if 'video_id' in stats:
            video_id = str(stats['video_id'])
            # Fit to available width
            max_id_len = 25
            if len(video_id) > max_id_len:
                video_id = video_id[:max_id_len - 3] + "..."
            pyxel.text(LABEL_X, y, "ID:", 2)  # Green label
            pyxel.text(VALUE_X, y, video_id, 2)  # Green value
            y += LINE_SPACING
        
        # Method (green label, cyan value) - moved to bottom
        if 'method' in stats:
            pyxel.text(LABEL_X, pyxel.height - 40, "METHOD:", 2)  # Green label
            pyxel.text(VALUE_X, pyxel.height - 40, stats['method'].upper(), 4)  # Cyan value
        
        # Verification status (green label, bright green value) - moved to bottom
        if stats.get('platform') == 'VK' and stats.get('views') is not None:
            pyxel.text(LABEL_X, pyxel.height - 28, "STATUS:", 2)  # Green label
            pyxel.text(VALUE_X, pyxel.height - 28, "VERIFIED", 3)  # Bright green - real data

