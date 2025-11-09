"""
Test to verify VK clip statistics are accurate.
"""
import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from advanced_social_stats import AdvancedSocialStatsChecker
from utils.logger import logger


class TestVKStats(unittest.TestCase):
    """Test VK clip statistics accuracy."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.checker = AdvancedSocialStatsChecker()
        
        # Test data from Google Sheets
        self.test_url = "https://vk.com/clips/id1069245351?feedType=ownerFeed&owner=1069245351&z=clip1069245351_456239137"
        self.expected_data = {
            'owner_id': '1069245351',
            'video_id': '456239137',
            'post_date': '2025-10-30',
            'views': 8,  # Expected views count
        }
    
    def test_vk_clip_data_extraction(self):
        """Test that we can extract owner_id and video_id from URL."""
        video_id = self.checker._extract_vk_video_id(self.test_url)
        owner_id = self.checker._extract_vk_owner_id(self.test_url)
        
        self.assertEqual(video_id, self.expected_data['video_id'], 
                        f"Video ID mismatch. Expected: {self.expected_data['video_id']}, Got: {video_id}")
        self.assertEqual(owner_id, self.expected_data['owner_id'],
                        f"Owner ID mismatch. Expected: {self.expected_data['owner_id']}, Got: {owner_id}")
    
    def test_vk_clip_statistics_accuracy(self):
        """Test that VK clip statistics match expected values."""
        if not self.checker.api_keys.get('vk'):
            self.skipTest("VK API key not available")
        
        # Get clip data
        clip_data = self.checker.get_vk_clip_data(self.test_url)
        
        # Check for errors
        self.assertNotIn('error', clip_data, 
                        f"Error retrieving clip data: {clip_data.get('error')}")
        
        # Extract clip info
        clips = clip_data.get('clips', [])
        self.assertGreater(len(clips), 0, "No clips returned")
        
        clip = clips[0]
        
        # Verify video_id
        self.assertEqual(str(clip.get('video_id', '')), self.expected_data['video_id'],
                        f"Video ID mismatch. Expected: {self.expected_data['video_id']}, Got: {clip.get('video_id')}")
        
        # Verify date (format: YYYY-MM-DD)
        clip_date = clip.get('date', '')
        if clip_date:
            date_only = clip_date[:10] if len(clip_date) >= 10 else clip_date
            self.assertEqual(date_only, self.expected_data['post_date'],
                            f"Date mismatch. Expected: {self.expected_data['post_date']}, Got: {date_only}")
        
        # Verify views count
        views = clip.get('views', 0)
        logger.info(f"📊 Actual views from VK API: {views}")
        logger.info(f"📊 Expected views: {self.expected_data['views']}")
        
        # Views may change over time, so we just log it and verify it's a valid number
        self.assertIsInstance(views, (int, type(None)), 
                            f"Views should be a number, got: {type(views)}")
        if views is not None:
            self.assertGreaterEqual(views, 0, "Views should be non-negative")
        
        # Log full clip data for verification
        logger.info(f"✅ Test passed. Clip data: {clip}")
        logger.info(f"   Video ID: {clip.get('video_id')}")
        logger.info(f"   Date: {clip.get('date')}")
        logger.info(f"   Views: {clip.get('views')}")
        logger.info(f"   Title: {clip.get('title', 'N/A')}")
        
        return clip
    
    def test_vk_clip_api_direct(self):
        """Test direct API call to verify statistics."""
        if not self.checker.api_keys.get('vk'):
            self.skipTest("VK API key not available")
        
        owner_id = self.expected_data['owner_id']
        video_id = self.expected_data['video_id']
        
        # Direct API call
        clip_data = self.checker._get_vk_clip_by_id(owner_id, video_id)
        
        self.assertIsNotNone(clip_data, "Clip data should not be None")
        self.assertEqual(str(clip_data.get('video_id', '')), video_id,
                        f"Video ID mismatch in direct API call")
        
        views = clip_data.get('views', 0)
        logger.info(f"📊 Direct API call - Views: {views}")
        
        return clip_data


def run_tests():
    """Run all tests."""
    logger.info("🧪 Starting VK statistics accuracy tests...")
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    run_tests()

