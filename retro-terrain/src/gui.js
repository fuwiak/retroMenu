// ===== CHART.JS REGISTER =====
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
} from "chart.js";

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Title);

// ===== YOUTUBE TRENDING =====
import { fetchYouTubeTrending } from "./socialData.js";


const els = {
  fetchBtn: document.getElementById("fetchBtn"),
  platform: document.getElementById("platform"),
  videoUrl: document.getElementById("videoUrl"),
  limitInput: document.getElementById("limitInput"),
  colorPicker: document.getElementById("colorPicker"),
  status: document.getElementById("statusLine"),
  wordChart: document.getElementById("wordChart"),
  commentsList: document.getElementById("commentsList"),
  logArea: document.getElementById("logArea"),
  logToggle: document.getElementById("logToggle"),
  logDrawer: document.getElementById("logDrawer"),
  toggleVideo: document.getElementById("toggleVideo"),
  videoFrame: document.getElementById("videoFrame"),
  modal: document.getElementById("modalOverlay"),
  modalWord: document.getElementById("modalWord"),
  modalComments: document.getElementById("modalComments"),
  modalClose: document.getElementById("modalClose"),
  modalSearch: document.getElementById("modalSearch"),
  exportCSVBtn: document.getElementById("exportCSVBtn"),
  chartContainer: document.getElementById("chartContainer"),
  trashZone: document.getElementById("trashZone"),
  analyzeSubtitlesBtn: document.getElementById("analyzeSubtitlesBtn"),
  subtitlesList: document.getElementById("subtitlesList"),
  subtitlesStatus: document.getElementById("subtitlesStatus"),
  subtitlesToggle: document.getElementById("subtitlesToggle"),
  subtitlesDrawer: document.getElementById("subtitlesDrawer"),
  trendingToggle: document.getElementById("trendingToggle"),
  trendingDrawer: document.getElementById("trendingDrawer"),
  loadTrendingBtn: document.getElementById("loadTrendingBtn"),
  trendingRegion: document.getElementById("trendingRegion"),
  trendingList: document.getElementById("trendingList"),
  trendingStatus: document.getElementById("trendingStatus"),
};

let chart = null;
let humAudio = null;
let allComments = [];
let allSubtitles = [];
let currentTags = []; // Store current top words for export
let draggedWordIndex = null;
let dragElement = null;
let userSettings = {
  stopwords: [],
  humEnabled: true,
  color: "#00ff99",
  minWordLength: 2,
  maxWordLength: 50,
  filterLanguage: "", // Empty = no filtering, "en", "pl", "ru"
  subtitleLanguages: [], // New: for youtubei
};

// ========== AUDIO ==========
function playClick(pitch = 440) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = pitch;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

function playTeleportFX() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

function startHum() {
  if (humAudio) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 55;
  gain.gain.value = 0.02;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  humAudio = { ctx, osc, gain };
}

function stopHum() {
  if (humAudio) {
    humAudio.osc.stop();
    humAudio.ctx.close();
    humAudio = null;
  }
}

// ========== LOGGING ==========
function log(msg) {
  const time = new Date().toLocaleTimeString();
  els.logArea.innerHTML += `[${time}] ${msg}<br>`;
  els.logArea.scrollTop = els.logArea.scrollHeight;
  console.log(msg);
}

// ========== VIDEO PREVIEW ==========
function updateVideoPreview(url) {
  const vid = getYouTubeVideoId(url);
  if (vid) {
    els.videoFrame.src = `https://www.youtube.com/embed/${vid}`;
    log(`🎥 Video preview loaded (${vid})`);
  } else {
    els.videoFrame.src = "";
  }
}

els.toggleVideo.addEventListener("click", () => {
  const hidden = els.videoFrame.classList.toggle("hidden");
  if (hidden) {
    els.toggleVideo.textContent = "🎥 Show Video";
    log("🎞 Hiding video preview");
  } else {
    els.toggleVideo.textContent = "🎥 Hide Video";
    log("🎞 Showing video preview");
  }
  playClick(hidden ? 350 : 500);
});

// ========== YOUTUBE COMMENTS ==========
const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YT_INNERTUBE_KEY = import.meta.env.VITE_YOUTUBEI_KEY || YT_KEY;

async function fetchYouTubeComments(videoId, limit = 100) {
  if (!YT_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const collected = [];
  let nextPageToken = '';
  const perPage = 100;

  while (collected.length < limit) {
    const remaining = Math.min(perPage, limit - collected.length);
    const params = new URLSearchParams({
      part: 'snippet',
      videoId,
      maxResults: remaining.toString(),
      key: YT_KEY,
      textFormat: 'plainText',
      order: 'relevance',
    });
    if (nextPageToken) {
      params.set('pageToken', nextPageToken);
    }

    const url = `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const message = `${response.status} ${response.statusText}`;
      throw new Error(`YouTube comments API error: ${message}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    for (const item of items) {
      const topComment = item?.snippet?.topLevelComment?.snippet;
      if (!topComment) {
        continue;
      }
      collected.push({
        text: topComment.textDisplay || topComment.textOriginal || '',
        author: topComment.authorDisplayName || 'Unknown',
        publishedAt: new Date(topComment.publishedAt || Date.now()),
        timestamp: new Date(topComment.publishedAt || Date.now()).getTime(),
      });
      if (collected.length >= limit) {
        break;
      }
    }

    if (!data.nextPageToken || collected.length >= limit) {
      break;
    }
    nextPageToken = data.nextPageToken;
  }

  log(`Fetched ${collected.length} comments for ${videoId}`);
  return collected;
}

function getPreferredSubtitleLanguages() {
  if (Array.isArray(userSettings.subtitleLanguages) && userSettings.subtitleLanguages.length > 0) {
    return userSettings.subtitleLanguages;
  }
  return ['en', 'pl', 'ru'];
}

async function fetchYouTubeSubtitles(videoId) {
  const languages = getPreferredSubtitleLanguages();

  // In development, call youtubei directly to avoid running the backend server.
  if (import.meta.env.DEV) {
    const direct = await fetchSubtitlesViaYoutubei(videoId, languages);
    if (direct && direct.length > 0) {
      return direct;
    }
  }

  // Primary path: call backend proxy which uses youtubei with yt-dlp fallback.
  try {
    const endpoint = `/api/subtitles/${videoId}?langs=${encodeURIComponent(languages.join(','))}`;
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const payload = await res.json();
      if (Array.isArray(payload?.tracks) && payload.tracks.length > 0) {
        const combined = payload.tracks.flatMap((track) => Array.isArray(track?.segments) ? track.segments : []);
        if (combined.length > 0) {
          log(`📝 Loaded ${combined.length} subtitle segments via ${payload.source || 'server proxy'}`);
          return combined.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
        }
      }
    } else {
      log(`⚠️ Subtitle service returned HTTP ${res.status}`);
    }
  } catch (err) {
    log(`⚠️ Subtitle service failed: ${err?.message || err}`);
  }

  // Fallback to direct youtubei call even in production.
  try {
    const direct = await fetchSubtitlesViaYoutubei(videoId, languages);
    if (direct && direct.length > 0) {
      return direct;
    }
  } catch (err) {
    log(`⚠️ youtubei fallback failed: ${err?.message || err}`);
  }

  // Final fallback: legacy timedtext probing.
  return await legacyFetchYouTubeSubtitles(videoId, languages);
}

async function fetchSubtitlesViaYoutubei(videoId, languages = ['en', 'pl', 'ru']) {
  if (!YT_INNERTUBE_KEY) {
    log('⚠️ youtubei key not configured; skipping direct youtubei fetch');
    return null;
  }

  try {
    const body = {
      context: {
        client: {
          hl: 'en',
          gl: 'US',
          clientName: 'WEB',
          clientVersion: '2.20241109.00.00',
          utcOffsetMinutes: -new Date().getTimezoneOffset(),
        },
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    };

    const playerRes = await fetch(`https://youtubei.googleapis.com/youtubei/v1/player?key=${YT_INNERTUBE_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!playerRes.ok) {
      log(`⚠️ youtubei player returned HTTP ${playerRes.status}`);
      return null;
    }

    const playerData = await playerRes.json();
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) {
      log('⚠️ youtubei response did not include caption tracks');
      return null;
    }

    const langSet = new Set(languages.map((l) => l.toLowerCase()));
    const selectedTracks = tracks.filter((track) => {
      const code = (track.languageCode || '').toLowerCase();
      const vss = (track.vssId || '').toLowerCase().replace(/^\./, '');
      return langSet.has(code) || langSet.has(vss);
    });

    const tracksToUse = selectedTracks.length > 0 ? selectedTracks : tracks.slice(0, 1);
    const subtitles = [];

    for (const track of tracksToUse) {
      try {
        const trackUrl = new URL(track.baseUrl);
        trackUrl.searchParams.set('fmt', 'json3');
        const captionRes = await fetch(trackUrl.toString(), {
          headers: {
            'Accept': 'application/json',
          },
        });
        if (!captionRes.ok) {
          log(`⚠️ Track fetch failed (${track.languageCode || track.vssId}): HTTP ${captionRes.status}`);
          continue;
        }
        const captionJson = await captionRes.json().catch(() => null);
        if (!captionJson?.events) {
          continue;
        }
        const parsed = parseSubtitles(captionJson.events);
        if (parsed.length > 0) {
          subtitles.push(...parsed);
        }
      } catch (trackErr) {
        log(`⚠️ Fetching track failed: ${trackErr?.message || trackErr}`);
      }
    }

    if (subtitles.length > 0) {
      log(`📝 Fetched ${subtitles.length} subtitle segments via youtubei`);
      return subtitles.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    }
  } catch (err) {
    log(`⚠️ youtubei request failed: ${err?.message || err}`);
  }

  return null;
}

async function legacyFetchYouTubeSubtitles(videoId, languages = ['en', 'pl', 'ru']) {
  
  // Helper to parse response safely
  const tryParseJSON = async (res) => {
    try {
      const text = await res.text();
      if (!text || text.trim().length === 0) {
        return null;
      }
      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        // If not JSON, might be XML or empty
        log(`⚠️ Response is not valid JSON: ${text.substring(0, 100)}...`);
        return null;
      }
    } catch (e) {
      return null;
    }
  };
  
  // First try with specific languages
  for (const lang of languages) {
    try {
      const url = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=json3`;
      log(`🔍 Trying subtitles in ${lang}...`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (res.ok && res.status === 200) {
        const data = await tryParseJSON(res);
        if (data && data.events && Array.isArray(data.events) && data.events.length > 0) {
          const subtitles = parseSubtitles(data.events);
          if (subtitles.length > 0) {
            log(`📝 Found ${subtitles.length} subtitle segments in ${lang}`);
            return subtitles;
          }
        }
      } else {
        log(`⚠️ HTTP ${res.status} for ${lang}`);
      }
    } catch (e) {
      log(`⚠️ Error fetching ${lang}: ${e.message}`);
      continue;
    }
  }
  
  // Try auto-generated captions (asr = automatic speech recognition)
  try {
    log(`🔍 Trying auto-generated captions...`);
    const url = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3&kind=asr`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (res.ok && res.status === 200) {
      const data = await tryParseJSON(res);
      if (data && data.events && Array.isArray(data.events) && data.events.length > 0) {
        const subtitles = parseSubtitles(data.events);
        if (subtitles.length > 0) {
          log(`📝 Found ${subtitles.length} auto-generated subtitle segments`);
          return subtitles;
        }
      }
    } else {
      log(`⚠️ HTTP ${res.status} for auto-generated`);
    }
  } catch (e) {
    log(`⚠️ Auto-generated captions failed: ${e.message}`);
  }
  
  // Try with track parameter for auto-generated
  try {
    log(`🔍 Trying track=asr method...`);
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3&tlang=en&track=asr`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (res.ok && res.status === 200) {
      const data = await tryParseJSON(res);
      if (data && data.events && Array.isArray(data.events) && data.events.length > 0) {
        const subtitles = parseSubtitles(data.events);
        if (subtitles.length > 0) {
          log(`📝 Found ${subtitles.length} auto-generated subtitle segments (track method)`);
          return subtitles;
        }
      }
    } else {
      log(`⚠️ HTTP ${res.status} for track method`);
    }
  } catch (e) {
    log(`⚠️ Track method failed: ${e.message}`);
  }
  
  // Try without language specification (auto-detect)
  try {
    log(`🔍 Trying auto-detect (no language specified)...`);
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (res.ok && res.status === 200) {
      const data = await tryParseJSON(res);
      if (data && data.events && Array.isArray(data.events) && data.events.length > 0) {
        const subtitles = parseSubtitles(data.events);
        if (subtitles.length > 0) {
          log(`📝 Found ${subtitles.length} subtitle segments (auto-detect)`);
          return subtitles;
        }
      }
    } else {
      log(`⚠️ HTTP ${res.status} for auto-detect`);
    }
  } catch (e) {
    log(`⚠️ Auto-detect failed: ${e.message}`);
  }
  
  // Try XML format as fallback (parse XML to extract text)
  try {
    log(`🔍 Trying XML format as fallback...`);
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    const res = await fetch(url);
    
    if (res.ok && res.status === 200) {
      const xmlText = await res.text();
      if (xmlText && xmlText.includes('<text')) {
        // Parse XML subtitles
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const texts = xmlDoc.querySelectorAll('text');
        
        if (texts.length > 0) {
          const subtitles = [];
          texts.forEach((text) => {
            const start = parseFloat(text.getAttribute('start') || '0');
            const duration = parseFloat(text.getAttribute('dur') || '0');
            const subtitleText = text.textContent || '';
            
            if (subtitleText.trim()) {
              subtitles.push({
                text: subtitleText.trim(),
                start: start,
                duration: duration,
              });
            }
          });
          
          if (subtitles.length > 0) {
            log(`📝 Found ${subtitles.length} subtitle segments (XML format)`);
            return subtitles;
          }
        }
      }
    }
  } catch (e) {
    log(`⚠️ XML format failed: ${e.message}`);
  }
  
  throw new Error('No subtitles found. The video may not have captions or auto-generated captions enabled.');
}

function parseSubtitles(events) {
  const subtitles = [];
  for (const event of events) {
    if (event.segs && Array.isArray(event.segs)) {
      const text = event.segs
        .map(seg => seg.utf8 || '')
        .join('')
        .trim();
      
      if (text && text.length > 0) {
        subtitles.push({
          text: text,
          start: (event.tStartMs || 0) / 1000,
          duration: (event.dDurationMs || 0) / 1000,
        });
      }
    }
  }
  return subtitles;
}

// ========== YOUTUBE TRENDING ==========
async function getTrendingVideos(regionCode = 'US') {
  const t = translations[currentLang] || translations.en;
  
  if (!YT_KEY) {
    if (els.trendingStatus) {
      els.trendingStatus.textContent = "❌ YouTube API key not configured";
      els.trendingStatus.style.opacity = "1";
    }
    log("❌ YouTube API key not found. Set VITE_YOUTUBE_API_KEY in .env");
    playClick(250);
    return;
  }
  
  if (els.trendingStatus) {
    els.trendingStatus.textContent = t.loadingTrending;
    els.trendingStatus.style.opacity = "1";
  }
  if (els.trendingList) {
    els.trendingList.innerHTML = "";
  }
  playClick(400);

  try {
    const videos = await fetchYouTubeTrending(YT_KEY, regionCode, 10);
    
    if (videos.length === 0) {
      if (els.trendingStatus) {
        els.trendingStatus.textContent = t.noTrendingVideos;
        els.trendingStatus.style.opacity = "1";
      }
      log("⚠️ No trending videos found for this region");
      playClick(250);
      return;
    }

    renderTrendingVideos(videos);

    if (els.trendingStatus) {
      els.trendingStatus.textContent = t.trendingLoaded.replace('{count}', videos.length);
    }
    log(`🔥 Loaded ${videos.length} trending videos from ${regionCode}`);
    playTeleportFX();
  } catch (e) {
    const t = translations[currentLang] || translations.en;
    if (els.trendingStatus) {
      els.trendingStatus.textContent = `${t.trendingError}: ${e.message}`;
      els.trendingStatus.style.opacity = "1";
    }
    log(`Error loading trending videos: ${e.message}`);
    playClick(250);
  }
}

function renderTrendingVideos(videos) {
  if (!els.trendingList) return;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  els.trendingList.innerHTML = videos
    .map(
      (video, index) => `
      <div class="trending-video-item" data-video-id="${video.id}" data-video-url="${video.url}" style="
        border: 1px solid var(--ui-color);
        padding: 8px;
        margin-bottom: 8px;
        background: rgba(0, 0, 0, 0.6);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        gap: 10px;
      ">
        <div style="flex-shrink: 0; position: relative;">
          <span style="
            position: absolute;
            top: 2px;
            left: 2px;
            background: rgba(0, 0, 0, 0.8);
            color: var(--ui-color);
            padding: 2px 4px;
            font-size: 0.65rem;
            font-weight: bold;
            border: 1px solid var(--ui-color);
            z-index: 1;
          ">#${index + 1}</span>
          <img src="${video.thumbnail}" alt="${video.title}" style="
            width: 120px;
            height: 67px;
            object-fit: cover;
            border: 1px solid var(--ui-color);
          " />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-weight: bold;
            font-size: 0.8rem;
            margin-bottom: 4px;
            color: var(--ui-color);
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            title="${video.title}"
          ">${video.title}</div>
          <div style="
            font-size: 0.7rem;
            opacity: 0.8;
            margin-bottom: 4px;
          ">📺 ${video.channelTitle}</div>
          <div style="
            display: flex;
            gap: 10px;
            font-size: 0.65rem;
            opacity: 0.7;
            flex-wrap: wrap;
          ">
            <span>👁️ ${formatNumber(video.views)}</span>
            <span>👍 ${formatNumber(video.likes)}</span>
            <span>💬 ${formatNumber(video.comments)}</span>
            <span style="color: ${video.likeRatio >= 90 ? '#00ff99' : video.likeRatio >= 70 ? '#ffff00' : '#ff6666'}">
              ⭐ ${video.likeRatio}%
            </span>
            <span>📈 ${formatNumber(video.relativeGrowth)}/h</span>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  // Add click handlers to load video for analysis
  document.querySelectorAll('.trending-video-item').forEach((item) => {
    item.addEventListener('click', () => {
      const videoUrl = item.dataset.videoUrl;
      const videoId = item.dataset.videoId;
      
      // Set URL in input
      if (els.videoUrl) {
        els.videoUrl.value = videoUrl;
      }
      
      // Set platform to YouTube
      if (els.platform) {
        els.platform.value = 'youtube';
      }
      
      // Update video preview
      updateVideoPreview(videoUrl);
      
      log(`📺 Selected trending video: ${item.querySelector('div[title]')?.getAttribute('title') || videoId}`);
      playClick(300);
      
      // Optionally auto-analyze
      // analyzeComments();
    });

    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(0, 255, 153, 0.1)';
      item.style.borderColor = 'var(--ui-color)';
      item.style.transform = 'scale(1.02)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.background = 'rgba(0, 0, 0, 0.6)';
      item.style.transform = 'scale(1)';
    });
  });
}

async function analyzeSubtitles() {
  const url = els.videoUrl.value.trim();
  const videoId = getYouTubeVideoId(url);
  
  if (!videoId) {
    if (els.subtitlesStatus) {
      els.subtitlesStatus.textContent = "❌ Invalid URL - YouTube only";
      els.subtitlesStatus.style.opacity = "1";
    }
    playClick(250);
    return;
  }
  
  const platform = els.platform.value;
  if (platform !== 'youtube') {
    if (els.subtitlesStatus) {
      els.subtitlesStatus.textContent = "❌ Subtitles analysis available only for YouTube";
      els.subtitlesStatus.style.opacity = "1";
    }
    playClick(250);
    return;
  }
  
  if (els.subtitlesStatus) {
    els.subtitlesStatus.textContent = "⏳ Fetching subtitles...";
    els.subtitlesStatus.style.opacity = "1";
  }
  if (els.subtitlesList) {
    els.subtitlesList.innerHTML = "";
  }
  playClick(400);
  
  try {
    const subtitles = await fetchYouTubeSubtitles(videoId);
    allSubtitles = subtitles;
    
    // Render subtitles
    if (els.subtitlesList) {
      renderSubtitles(subtitles);
    }
    
    // Analyze subtitles
    const color = els.colorPicker.value;
    const stopwords = new Set([
      "the",
      "a",
      "i",
      "и",
      "в",
      "на",
      "что",
      "это",
      ...userSettings.stopwords,
    ]);
    
    // Create subtitle texts with timestamps for analysis
    const subtitleTexts = subtitles.map((s, idx) => ({
      text: s.text,
      publishedAt: new Date(Date.now() - (subtitles.length - idx) * 1000),
      timestamp: Date.now() - (subtitles.length - idx) * 1000,
    }));
    
    // Combine with comments if available
    const combinedData = allComments.length > 0 
      ? [...allComments, ...subtitleTexts]
      : subtitleTexts;
    
    const tags = getTopWords(combinedData, stopwords);
    renderChart(tags, color);
    
    if (els.subtitlesStatus) {
      els.subtitlesStatus.textContent = `✅ Loaded ${subtitles.length} subtitle segments`;
    }
    log(`📝 Subtitles analysis complete: ${subtitles.length} segments`);
    playTeleportFX();
  } catch (e) {
    if (els.subtitlesStatus) {
      els.subtitlesStatus.textContent = `❌ Error: ${e.message}`;
      els.subtitlesStatus.style.opacity = "1";
    }
    log(`Error fetching subtitles: ${e.message}`);
    playClick(250);
  }
}

function renderSubtitles(subtitles) {
  if (!els.subtitlesList) return;
  
  els.subtitlesList.innerHTML = subtitles
    .map((s) => {
      const minutes = Math.floor(s.start / 60);
      const seconds = Math.floor(s.start % 60);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      return `<div style="border-bottom:1px solid var(--ui-color);padding:4px;">
        <span style="opacity: 0.7; font-size: 0.7rem;">[${timeStr}]</span> ${s.text}
      </div>`;
    })
    .join("");
}

// ========== TEXT ANALYSIS ==========
function isWordInLanguage(word, lang) {
  if (!lang || lang === "") return true; // No filtering
  
  // Basic character set checks for different languages
  const patterns = {
    en: /^[a-z]+$/i, // Only English letters
    pl: /^[a-ząćęłńóśźż]+$/i, // Polish letters
    ru: /^[а-яё]+$/i, // Russian Cyrillic letters
  };
  
  return patterns[lang] ? patterns[lang].test(word) : true;
}

function getTopWords(comments, stopwords) {
  const freq = {};
  const minLen = userSettings.minWordLength || 1;
  const maxLen = userSettings.maxWordLength || 100;
  const filterLang = userSettings.filterLanguage || "";
  
  for (const c of comments) {
    const text = typeof c === 'string' ? c : c.text;
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, "")
      .split(/\s+/);
    for (const w of words) {
      if (!w || stopwords.has(w)) continue;
      
      // Filter by word length
      if (w.length < minLen || w.length > maxLen) continue;
      
      // Filter by language
      if (filterLang && !isWordInLanguage(w, filterLang)) continue;
      
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

// ========== RENDER CHART ==========
function renderChart(tags, color) {
  currentTags = tags; // Store for export
  if (chart) chart.destroy();
  chart = new Chart(els.wordChart, {
    type: "bar",
    data: {
      labels: tags.map((t) => t.word),
      datasets: [
        {
          label: "Frequency",
          data: tags.map((t) => t.count),
          backgroundColor: color,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          const word = tags[idx].word;
          showCommentsForWord(word);
        }
      },
      onHover: (e, activeElements) => {
        if (activeElements.length > 0) {
          els.wordChart.style.cursor = 'grab';
        } else {
          els.wordChart.style.cursor = 'default';
        }
      },
      scales: {
        x: {
          ticks: { color, font: { size: 9 } },
          grid: { color: color + "22" },
        },
        y: {
          ticks: { color, font: { size: 9 } },
          grid: { color: color + "22" },
        },
      },
    },
  });
  
  // Setup drag and drop for chart bars
  setupChartDragAndDrop();
}

// ========== REMOVE WORD ==========
function removeWordFromAnalysis(word) {
  // Add to stopwords
  if (!userSettings.stopwords.includes(word.toLowerCase())) {
    userSettings.stopwords.push(word.toLowerCase());
    log(`🚫 Added "${word}" to stopwords and removed from analysis`);
    playClick(300);
    
    // Re-analyze comments with updated stopwords
    const color = els.colorPicker.value;
    const stopwords = new Set([
      "the",
      "a",
      "i",
      "и",
      "в",
      "на",
      "что",
      "это",
      ...userSettings.stopwords,
    ]);
    
    const tags = getTopWords(allComments, stopwords);
    renderChart(tags, color);
    
    els.status.textContent = `✅ Removed "${word}" from analysis`;
  } else {
    log(`⚠️ "${word}" is already in stopwords`);
    playClick(250);
  }
}

// ========== EXPORT TO CSV ==========
function exportTopWordsToCSV() {
  if (!currentTags || currentTags.length === 0) {
    els.status.textContent = "❌ No data to export";
    log("⚠️ No top words to export");
    return;
  }
  
  // Create CSV content
  const csvContent = [
    ['Word', 'Count'].join(','),
    ...currentTags.map(tag => `"${tag.word}",${tag.count}`)
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `top_words_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  log(`📥 Exported ${currentTags.length} words to CSV`);
  playClick(500);
  els.status.textContent = `✅ Exported ${currentTags.length} words to CSV`;
}

// ========== RENDER COMMENTS ==========
function renderComments(comments) {
  els.commentsList.innerHTML = comments
    .map(
      (c) =>
        `<div style="border-bottom:1px solid var(--ui-color);padding:4px;">${typeof c === 'string' ? c : c.text}</div>`
    )
    .join("");
}

// ========== ANALYZE ==========
async function analyzeComments() {
  const url = els.videoUrl.value.trim();
  const limit = parseInt(els.limitInput.value);
  const color = els.colorPicker.value;
  const stopwords = new Set([
    "the",
    "a",
    "i",
    "и",
    "в",
    "на",
    "что",
    "это",
    ...userSettings.stopwords,
  ]);

  if (!YT_KEY) {
    els.status.textContent = "❌ Missing API key";
    return;
  }
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    els.status.textContent = "❌ Invalid URL";
    return;
  }

  els.status.textContent = "⏳ Fetching comments...";
  playClick(400);
  updateVideoPreview(url);
  try {
    const comments = await fetchYouTubeComments(videoId, limit);
    allComments = comments;
    const tags = getTopWords(comments, stopwords);
    renderChart(tags, color);
    renderComments(comments);
    
    els.status.textContent = `✅ Loaded ${comments.length} comments`;
    log(`Analysis complete: ${comments.length} comments, ${tags.length} words`);
    playTeleportFX();
  } catch (e) {
    els.status.textContent = `❌ Error: ${e.message}`;
    log(`Error: ${e.message}`);
  }
}

els.fetchBtn.addEventListener("click", analyzeComments);

// Analyze subtitles button
if (els.analyzeSubtitlesBtn) {
  els.analyzeSubtitlesBtn.addEventListener("click", analyzeSubtitles);
  
  els.analyzeSubtitlesBtn.addEventListener("mouseenter", () => {
    els.analyzeSubtitlesBtn.style.background = "var(--ui-color)";
    els.analyzeSubtitlesBtn.style.color = "#000";
  });
  
  els.analyzeSubtitlesBtn.addEventListener("mouseleave", () => {
    els.analyzeSubtitlesBtn.style.background = "rgba(0, 0, 0, 0.8)";
    els.analyzeSubtitlesBtn.style.color = "var(--ui-color)";
  });
}

// Load Trending button
if (els.loadTrendingBtn && els.trendingRegion) {
  els.loadTrendingBtn.addEventListener("click", () => {
    const region = els.trendingRegion.value;
    getTrendingVideos(region);
  });
  
  els.loadTrendingBtn.addEventListener("mouseenter", () => {
    els.loadTrendingBtn.style.background = "var(--ui-color)";
    els.loadTrendingBtn.style.color = "#000";
  });
  
  els.loadTrendingBtn.addEventListener("mouseleave", () => {
    els.loadTrendingBtn.style.background = "rgba(0, 0, 0, 0.8)";
    els.loadTrendingBtn.style.color = "var(--ui-color)";
  });
}

// Export CSV button
if (els.exportCSVBtn) {
  els.exportCSVBtn.addEventListener("click", exportTopWordsToCSV);
  
  els.exportCSVBtn.addEventListener("mouseenter", () => {
    els.exportCSVBtn.style.background = "var(--ui-color)";
    els.exportCSVBtn.style.color = "#000";
  });
  
  els.exportCSVBtn.addEventListener("mouseleave", () => {
    els.exportCSVBtn.style.background = "rgba(0, 0, 0, 0.8)";
    els.exportCSVBtn.style.color = "var(--ui-color)";
  });
}

// ========== CHART DRAG AND DROP ==========
function setupChartDragAndDrop() {
  if (!els.wordChart || !chart) return;
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentIndex = null;
  
  els.wordChart.addEventListener('mousedown', (e) => {
    if (!chart) return;
    
    const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
    
    if (points.length > 0) {
      isDragging = false;
      currentIndex = points[0].index;
      startX = e.clientX;
      startY = e.clientY;
      
      // Create drag preview element
      if (currentTags && currentTags[currentIndex]) {
        dragElement = document.createElement('div');
        dragElement.textContent = currentTags[currentIndex].word;
        dragElement.style.position = 'fixed';
        dragElement.style.pointerEvents = 'none';
        dragElement.style.background = 'rgba(0, 0, 0, 0.9)';
        dragElement.style.border = '2px solid var(--ui-color)';
        dragElement.style.color = 'var(--ui-color)';
        dragElement.style.padding = '8px 12px';
        dragElement.style.borderRadius = '4px';
        dragElement.style.fontFamily = 'inherit';
        dragElement.style.fontSize = '0.9rem';
        dragElement.style.zIndex = '10000';
        dragElement.style.opacity = '0.8';
        document.body.appendChild(dragElement);
      }
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (currentIndex !== null && dragElement) {
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      
      // Start dragging if moved more than 5px
      if (deltaX > 5 || deltaY > 5) {
        isDragging = true;
        els.wordChart.style.cursor = 'grabbing';
        
        dragElement.style.left = (e.clientX - dragElement.offsetWidth / 2) + 'px';
        dragElement.style.top = (e.clientY - dragElement.offsetHeight / 2) + 'px';
      }
      
      // Show trash zone when dragging
      if (isDragging && els.trashZone) {
        const trashRect = els.trashZone.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        if (mouseX >= trashRect.left && mouseX <= trashRect.right &&
            mouseY >= trashRect.top && mouseY <= trashRect.bottom) {
          els.trashZone.style.opacity = '1';
          els.trashZone.style.pointerEvents = 'auto';
          dragElement.style.borderColor = '#ff4444';
          dragElement.style.color = '#ff4444';
        } else {
          els.trashZone.style.opacity = '0.5';
          dragElement.style.borderColor = 'var(--ui-color)';
          dragElement.style.color = 'var(--ui-color)';
        }
      }
    }
  });
  
  document.addEventListener('mouseup', (e) => {
    if (currentIndex !== null && isDragging && dragElement) {
      const trashRect = els.trashZone?.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Check if dropped on trash zone
      if (trashRect && 
          mouseX >= trashRect.left && mouseX <= trashRect.right &&
          mouseY >= trashRect.top && mouseY <= trashRect.bottom &&
          currentTags && currentTags[currentIndex]) {
        const word = currentTags[currentIndex].word;
        removeWordFromAnalysis(word);
      }
      
      // Cleanup
      if (dragElement) {
        document.body.removeChild(dragElement);
        dragElement = null;
      }
      
      els.wordChart.style.cursor = 'grab';
      if (els.trashZone) {
        els.trashZone.style.opacity = '0';
        els.trashZone.style.pointerEvents = 'none';
      }
    } else if (currentIndex !== null && !isDragging && dragElement) {
      // Just a click, not a drag - cleanup
      if (dragElement) {
        document.body.removeChild(dragElement);
        dragElement = null;
      }
    }
    
    isDragging = false;
    currentIndex = null;
  });
  
  // Show trash zone on drag over
  if (els.trashZone) {
    els.trashZone.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  }
}

// ========== HELPERS ==========
function getYouTubeVideoId(url) {
  const match =
    url.match(/v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ========== MODAL ==========
function showCommentsForWord(word) {
  els.modalWord.textContent = word;
  els.modalComments.innerHTML = allComments
    .filter((c) => {
      const text = typeof c === 'string' ? c : c.text;
      return text.toLowerCase().includes(word.toLowerCase());
    })
    .map(
      (c) => {
        const text = typeof c === 'string' ? c : c.text;
        return `<div style="border-bottom:1px solid var(--ui-color); padding:4px;">${text}</div>`;
      }
    )
    .join("");
  els.modal.classList.remove("hidden");
  playTeleportFX();
  log(`💬 Showing comments with "${word}"`);
}

els.modalClose.addEventListener("click", () => {
  els.modal.classList.add("hidden");
  playClick(300);
});

els.modal.addEventListener("click", (e) => {
  if (e.target === els.modal) {
    els.modal.classList.add("hidden");
    playClick(250);
  }
});

els.modalSearch.addEventListener("input", (e) => {
  const val = e.target.value.toLowerCase();
  const word = els.modalWord.textContent.toLowerCase();
  const filtered = allComments.filter((c) => {
    const text = typeof c === 'string' ? c : c.text;
    return text.toLowerCase().includes(word) && text.toLowerCase().includes(val);
  });
  els.modalComments.innerHTML = filtered
    .map(
      (c) => {
        const text = typeof c === 'string' ? c : c.text;
        return `<div style="border-bottom:1px solid var(--ui-color); padding:4px;">${text}</div>`;
      }
    )
    .join("");
});

// ========== LOG DRAWER ==========
els.logToggle.addEventListener("click", () => {
  els.logDrawer.classList.toggle("open");
  playClick(400);
});

// ========== TRENDING DRAWER ==========
if (els.trendingToggle && els.trendingDrawer) {
  els.trendingToggle.addEventListener("click", () => {
    els.trendingDrawer.classList.toggle("open");
    playClick(400);
  });
} else {
  // Fallback: try to get elements directly
  const trendingToggleEl = document.getElementById("trendingToggle");
  const trendingDrawerEl = document.getElementById("trendingDrawer");
  if (trendingToggleEl && trendingDrawerEl) {
    trendingToggleEl.addEventListener("click", () => {
      trendingDrawerEl.classList.toggle("open");
      playClick(400);
    });
  } else {
    console.warn('Trending toggle or drawer not found', {
      fromEls: { toggle: !!els.trendingToggle, drawer: !!els.trendingDrawer },
      fromDOM: { toggle: !!trendingToggleEl, drawer: !!trendingDrawerEl }
    });
  }
}

// ========== SUBTITLES DRAWER ==========
if (els.subtitlesToggle && els.subtitlesDrawer) {
  els.subtitlesToggle.addEventListener("click", () => {
    els.subtitlesDrawer.classList.toggle("open");
    playClick(400);
  });
} else {
  // Fallback: try to get elements directly
  const subtitlesToggleEl = document.getElementById("subtitlesToggle");
  const subtitlesDrawerEl = document.getElementById("subtitlesDrawer");
  if (subtitlesToggleEl && subtitlesDrawerEl) {
    subtitlesToggleEl.addEventListener("click", () => {
      subtitlesDrawerEl.classList.toggle("open");
      playClick(400);
    });
  } else {
    console.warn('Subtitles toggle or drawer not found', {
      fromEls: { toggle: !!els.subtitlesToggle, drawer: !!els.subtitlesDrawer },
      fromDOM: { toggle: !!subtitlesToggleEl, drawer: !!subtitlesDrawerEl }
    });
  }
}

// ========== LANGUAGE TOGGLE ==========
const langToggle = document.getElementById("langToggle");
let currentLang = "en";

const translations = {
  en: {
    title: "📊 RETRO SOCIAL ANALYTICS",
    platform: { youtube: "YouTube", vk: "VK" },
    videoUrl: "Video or Short URL...",
    analyze: "▶ Analyze",
    settings: "⚙️ Settings",
    idle: "💤 Idle — waiting for input",
    topWords: "TOP WORDS",
    comments: "COMMENTS",
    settingsTitle: "⚙️ SETTINGS",
    stopwordsLabel: "Stopwords (comma-separated):",
    humToggle: "Enable CRT hum sound",
    save: "💾 Save",
    cancel: "❌ Cancel",
    exportCSV: "📥 Export CSV",
    tipRemove: "💡 Drag a bar to the trash to remove it from analysis",
    wordLengthLabel: "Word length filter:",
    filterLanguageLabel: "Filter by language (remove words from other languages):",
    noFiltering: "No filtering",
    englishOnly: "English only",
    polishOnly: "Polish only",
    russianOnly: "Russian only",
    subtitles: "📝 SUBTITLES",
    subtitlesYouTubeOnly: "(YouTube only)",
    analyzeSubtitles: "🎬 Analyze Video Subtitles",
    trending: "🔥 TRENDING",
    loadTrending: "🔥 Load Trending",
    loadingTrending: "⏳ Loading trending videos...",
    trendingLoaded: "✅ Loaded {count} trending videos",
    trendingError: "❌ Error loading trending videos",
    noTrendingVideos: "⚠️ No trending videos found",
  },
  pl: {
    title: "📊 RETRO ANALITYKA SPOŁECZNOŚCIOWA",
    platform: { youtube: "YouTube", vk: "VK" },
    videoUrl: "URL filmu lub Shorta...",
    analyze: "▶ Analizuj",
    settings: "⚙️ Ustawienia",
    idle: "💤 Oczekiwanie — oczekiwanie na dane",
    topWords: "NAJCZĘSTSZE SŁOWA",
    comments: "KOMENTARZE",
    settingsTitle: "⚙️ USTAWIENIA",
    stopwordsLabel: "Słowa stop (oddzielone przecinkami):",
    humToggle: "Włącz dźwięk CRT",
    save: "💾 Zapisz",
    cancel: "❌ Anuluj",
    exportCSV: "📥 Eksportuj CSV",
    tipRemove: "💡 Przeciągnij słupek do kosza, aby usunąć z analizy",
    wordLengthLabel: "Filtr długości słów:",
    filterLanguageLabel: "Filtruj po języku (usuń słowa z innych języków):",
    noFiltering: "Bez filtrowania",
    englishOnly: "Tylko angielski",
    polishOnly: "Tylko polski",
    russianOnly: "Tylko rosyjski",
    subtitles: "📝 NAPISY",
    subtitlesYouTubeOnly: "(tylko YouTube)",
    analyzeSubtitles: "🎬 Analizuj napisy do filmu",
    trending: "🔥 TRENDING",
    loadTrending: "🔥 Załaduj trendy",
    loadingTrending: "⏳ Ładowanie trendujących filmów...",
    trendingLoaded: "✅ Załadowano {count} trendujących filmów",
    trendingError: "❌ Błąd ładowania trendujących filmów",
    noTrendingVideos: "⚠️ Nie znaleziono trendujących filmów",
  },
  ru: {
    title: "📊 РЕТРО СОЦИАЛЬНАЯ АНАЛИТИКА",
    platform: { youtube: "YouTube", vk: "VK" },
    videoUrl: "URL видео или Short...",
    analyze: "▶ Анализировать",
    settings: "⚙️ Настройки",
    idle: "💤 Ожидание — ожидание ввода",
    topWords: "ТОП СЛОВА",
    comments: "КОММЕНТАРИИ",
    settingsTitle: "⚙️ НАСТРОЙКИ",
    stopwordsLabel: "Стоп-слова (через запятую):",
    humToggle: "Включить звук CRT",
    save: "💾 Сохранить",
    cancel: "❌ Отмена",
    exportCSV: "📥 Экспорт CSV",
    tipRemove: "💡 Перетащите столбец в корзину, чтобы удалить из анализа",
    wordLengthLabel: "Фильтр длины слов:",
    filterLanguageLabel: "Фильтр по языку (удалить слова других языков):",
    noFiltering: "Без фильтрации",
    englishOnly: "Только английский",
    polishOnly: "Только польский",
    russianOnly: "Только русский",
    subtitles: "📝 СУБТИТРЫ",
    subtitlesYouTubeOnly: "(только YouTube)",
    analyzeSubtitles: "🎬 Анализировать субтитры",
    trending: "🔥 ТРЕНДЫ",
    loadTrending: "🔥 Загрузить тренды",
    loadingTrending: "⏳ Загрузка трендовых видео...",
    trendingLoaded: "✅ Загружено {count} трендовых видео",
    trendingError: "❌ Ошибка загрузки трендовых видео",
    noTrendingVideos: "⚠️ Трендовые видео не найдены",
  },
};

function applyTranslation(lang) {
  currentLang = lang;
  const t = translations[lang];
  
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = t.title;
  
  const videoUrl = document.getElementById("videoUrl");
  if (videoUrl) videoUrl.placeholder = t.videoUrl;
  
  const fetchBtn = document.getElementById("fetchBtn");
  if (fetchBtn) fetchBtn.textContent = t.analyze;
  
  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) settingsBtn.textContent = t.settings;
  
  // Update flag icon based on current language
  const flags = { en: "🇬🇧", pl: "🇵🇱", ru: "🇷🇺" };
  if (langToggle) langToggle.textContent = flags[lang];
  
  const platformSelect = document.getElementById("platform");
  if (platformSelect) {
    const currentPlatformValue = platformSelect.value;
    platformSelect.innerHTML = `
      <option value="youtube">${t.platform.youtube}</option>
      <option value="vk">${t.platform.vk}</option>
    `;
    platformSelect.value = currentPlatformValue;
  }
  
  const wordsPanel = document.querySelector("#panel-words h2");
  if (wordsPanel) wordsPanel.innerHTML = `${t.topWords} <span class="expand">⤡</span>`;
  
  const commentsPanel = document.querySelector("#panel-comments h2");
  if (commentsPanel) commentsPanel.innerHTML = `${t.comments} <span class="expand">⤡</span>`;
  
  const exportBtn = document.getElementById("exportCSVBtn");
  if (exportBtn) exportBtn.textContent = t.exportCSV;
  
  const tipText = document.querySelector("#panel-words div[style*='font-size: 0.7rem']");
  if (tipText) tipText.textContent = t.tipRemove;
  
  // Update subtitles drawer
  const subtitlesToggle = document.getElementById("subtitlesToggle");
  if (subtitlesToggle) {
    subtitlesToggle.innerHTML = `${t.subtitles} <span style="font-size: 0.7rem; opacity: 0.8;">${t.subtitlesYouTubeOnly}</span>`;
  }
  
  const subtitlesDrawerTitle = document.querySelector("#subtitlesDrawer h2");
  if (subtitlesDrawerTitle) {
    subtitlesDrawerTitle.textContent = t.subtitles;
  }
  
  const analyzeSubtitlesBtn = document.getElementById("analyzeSubtitlesBtn");
  if (analyzeSubtitlesBtn) analyzeSubtitlesBtn.textContent = t.analyzeSubtitles;
  
  // Update trending drawer
  const trendingToggle = document.getElementById("trendingToggle");
  if (trendingToggle) trendingToggle.textContent = t.trending;
  
  const trendingDrawerTitle = document.querySelector("#trendingDrawer h2");
  if (trendingDrawerTitle) trendingDrawerTitle.textContent = t.trending;
  
  const loadTrendingBtn = document.getElementById("loadTrendingBtn");
  if (loadTrendingBtn) loadTrendingBtn.textContent = t.loadTrending;
  
  // Update status line if it's idle (check for idle text in any language)
  const statusEl = document.getElementById("statusLine");
  const idlePatterns = ["Idle", "Oczekiwanie", "Ожидание"];
  if (statusEl && idlePatterns.some(pattern => statusEl.textContent.includes(pattern))) {
    statusEl.textContent = t.idle;
  }
  
  // Update settings overlay labels if visible
  const overlay = document.getElementById("settingsOverlay");
  if (overlay && !overlay.classList.contains("hidden")) {
    const settingsTitle = document.querySelector("#settingsContent h2");
    if (settingsTitle) settingsTitle.textContent = t.settingsTitle;
    
    const stopwordsLabel = document.querySelector("#settingsContent label");
    if (stopwordsLabel && stopwordsLabel.querySelector("textarea")) {
      stopwordsLabel.textContent = t.stopwordsLabel;
    }
    
    const humLabel = document.querySelector("#settingsContent label:last-of-type span");
    if (humLabel) {
      humLabel.textContent = t.humToggle;
    }
    
    const saveBtn = document.getElementById("saveSettings");
    if (saveBtn) saveBtn.textContent = t.save;
    
    const cancelBtn = document.getElementById("cancelSettings");
    if (cancelBtn) cancelBtn.textContent = t.cancel;
  }
}

langToggle.addEventListener("click", () => {
  // Cycle through languages: en -> pl -> ru -> en
  const langOrder = ["en", "pl", "ru"];
  const currentIndex = langOrder.indexOf(currentLang);
  const nextIndex = (currentIndex + 1) % langOrder.length;
  const newLang = langOrder[nextIndex];
  
  applyTranslation(newLang);
  playClick(450);
  log(`🌐 Language switched to ${newLang.toUpperCase()}`);
});

// ========== SETTINGS ==========
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsBtn = document.getElementById("settingsBtn");
const saveSettings = document.getElementById("saveSettings");
const cancelSettings = document.getElementById("cancelSettings");
const stopwordsInput = document.getElementById("stopwordsInput");

settingsBtn.addEventListener("click", () => {
  // Load current settings into form
  stopwordsInput.value = userSettings.stopwords.join(", ");
  const humToggle = document.getElementById("humToggle");
  if (humToggle) humToggle.checked = userSettings.humEnabled;
  
  const minWordLength = document.getElementById("minWordLength");
  if (minWordLength) minWordLength.value = userSettings.minWordLength || 2;
  
  const maxWordLength = document.getElementById("maxWordLength");
  if (maxWordLength) maxWordLength.value = userSettings.maxWordLength || 50;
  
  const filterLanguage = document.getElementById("filterLanguage");
  if (filterLanguage) filterLanguage.value = userSettings.filterLanguage || "";
  
  // Update translations in settings overlay
  const t = translations[currentLang];
  const settingsTitle = document.querySelector("#settingsContent h2");
  if (settingsTitle) settingsTitle.textContent = t.settingsTitle;
  
  const stopwordsLabel = document.querySelector("#settingsContent label");
  if (stopwordsLabel && stopwordsLabel.querySelector("textarea")) {
    stopwordsLabel.textContent = t.stopwordsLabel;
  }
  
  const humLabel = document.querySelector("#settingsContent label:last-of-type span");
  if (humLabel) {
    humLabel.textContent = t.humToggle;
  }
  
  // Update word length filter label
  const wordLengthLabel = document.getElementById("wordLengthLabel");
  if (wordLengthLabel) wordLengthLabel.textContent = t.wordLengthLabel;
  
  // Update language filter label
  const filterLanguageLabel = document.getElementById("filterLanguageLabel");
  if (filterLanguageLabel) filterLanguageLabel.textContent = t.filterLanguageLabel;
  
  // Update select options
  if (filterLanguage) {
    filterLanguage.innerHTML = `
      <option value="">${t.noFiltering}</option>
      <option value="en">${t.englishOnly}</option>
      <option value="pl">${t.polishOnly}</option>
      <option value="ru">${t.russianOnly}</option>
    `;
    filterLanguage.value = userSettings.filterLanguage || "";
  }
  
  const saveBtn = document.getElementById("saveSettings");
  if (saveBtn) saveBtn.textContent = t.save;
  
  const cancelBtn = document.getElementById("cancelSettings");
  if (cancelBtn) cancelBtn.textContent = t.cancel;
  
  settingsOverlay.classList.remove("hidden");
  playClick(500);
  log("⚙️ Settings opened");
});

cancelSettings.addEventListener("click", () => {
  settingsOverlay.classList.add("hidden");
  playClick(350);
  log("❌ Settings closed (cancel)");
});

saveSettings.addEventListener("click", () => {
  const sw = stopwordsInput.value
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  userSettings.stopwords = sw;
  userSettings.color = els.colorPicker.value;
  userSettings.humEnabled = document.getElementById("humToggle")?.checked ?? true;
  
  // Save word length filters
  const minWordLength = document.getElementById("minWordLength");
  const maxWordLength = document.getElementById("maxWordLength");
  if (minWordLength) userSettings.minWordLength = parseInt(minWordLength.value) || 2;
  if (maxWordLength) userSettings.maxWordLength = parseInt(maxWordLength.value) || 50;
  
  // Save language filter
  const filterLanguage = document.getElementById("filterLanguage");
  if (filterLanguage) userSettings.filterLanguage = filterLanguage.value || "";
  
  document.documentElement.style.setProperty("--ui-color", userSettings.color);
  if (userSettings.humEnabled) startHum();
  else stopHum();
  
  // Re-analyze if comments are already loaded
  if (allComments.length > 0) {
    const color = els.colorPicker.value;
    const stopwords = new Set([
      "the",
      "a",
      "i",
      "и",
      "в",
      "на",
      "что",
      "это",
      ...userSettings.stopwords,
    ]);
    const tags = getTopWords(allComments, stopwords);
    renderChart(tags, color);
  }
  
  settingsOverlay.classList.add("hidden");
  log("💾 Settings saved");
  playTeleportFX();
});

// Close settings overlay when clicking outside
settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) {
    settingsOverlay.classList.add("hidden");
    playClick(250);
  }
});

// Zmiana koloru w locie
els.colorPicker.addEventListener("input", (e) => {
  document.documentElement.style.setProperty("--ui-color", e.target.value);
  playClick(420);
  log(`🎨 Theme color changed to ${e.target.value}`);
});

// ========== START HUM ==========
if (userSettings.humEnabled) {
  startHum();
  log("🟢 CRT hum started");
}
