import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import ytDlp from 'yt-dlp-exec';

const app = express();
app.disable('x-powered-by');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const DEFAULT_LANGS = ['en', 'pl', 'ru'];
const youtubeiKey = process.env.YOUTUBEI_API_KEY || process.env.VITE_YOUTUBEI_KEY || process.env.VITE_YOUTUBE_API_KEY || '';

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/subtitles/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const languages = parseLanguages(req.query.langs);

  try {
    const youtubeiResult = await fetchViaYoutubei(videoId, languages);
    if (youtubeiResult) {
      return res.json(youtubeiResult);
    }
  } catch (err) {
    console.error('[subtitles] youtubei error', err);
  }

  try {
    const ytDlpResult = await fetchViaYtDlp(videoId, languages);
    if (ytDlpResult) {
      return res.json(ytDlpResult);
    }
  } catch (err) {
    console.error('[subtitles] yt-dlp error', err);
  }

  res.status(404).json({ error: 'No subtitles found for requested video.' });
});

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`[server] listening on port ${port}`);
});

function parseLanguages(rawLangs) {
  if (typeof rawLangs !== 'string' || rawLangs.trim().length === 0) {
    return DEFAULT_LANGS;
  }
  return rawLangs
    .split(',')
    .map((lang) => lang.trim().toLowerCase())
    .filter((lang) => lang.length > 0);
}

async function fetchViaYoutubei(videoId, languages) {
  if (!youtubeiKey) {
    return null;
  }

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

  const playerResponse = await fetch(`https://youtubei.googleapis.com/youtubei/v1/player?key=${youtubeiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!playerResponse.ok) {
    throw new Error(`youtubei player returned HTTP ${playerResponse.status}`);
  }

  const playerJson = await playerResponse.json();
  const tracks = playerJson?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return null;
  }

  const langSet = new Set(languages.length ? languages : DEFAULT_LANGS);
  const filteredTracks = tracks.filter((track) => {
    const languageCode = (track.languageCode || '').toLowerCase();
    const vssId = (track.vssId || '').toLowerCase().replace(/^\./, '');
    return langSet.has(languageCode) || langSet.has(vssId);
  });

  const tracksToUse = filteredTracks.length > 0 ? filteredTracks : tracks.slice(0, 1);
  const payloadTracks = [];

  for (const track of tracksToUse) {
    const segments = await downloadCaptionTrack(track.baseUrl);
    if (segments.length > 0) {
      payloadTracks.push({
        language: track.languageCode || track.vssId || 'unknown',
        name: extractTrackName(track),
        segments,
      });
    }
  }

  if (payloadTracks.length === 0) {
    return null;
  }

  return {
    source: 'youtubei',
    tracks: payloadTracks,
  };
}

async function fetchViaYtDlp(videoId, languages) {
  const url = /^https?:/.test(videoId) ? videoId : `https://www.youtube.com/watch?v=${videoId}`;
  const output = await ytDlp(url, {
    dumpSingleJson: true,
    skipDownload: true,
    noWarnings: true,
    quiet: true,
    referer: 'https://www.youtube.com/',
  });

  const json = typeof output === 'string' ? JSON.parse(output) : output;
  const subtitles = json.subtitles || {};
  const automatic = json.automatic_captions || {};
  const preferred = [...new Set(languages.length ? languages : DEFAULT_LANGS)];
  const payloadTracks = [];

  const candidateMap = new Map();
  for (const [lang, entries] of Object.entries(automatic)) {
    candidateMap.set(lang.toLowerCase(), entries);
  }
  for (const [lang, entries] of Object.entries(subtitles)) {
    candidateMap.set(lang.toLowerCase(), entries);
  }

  for (const lang of preferred) {
    const entries = candidateMap.get(lang) || candidateMap.get(`${lang}-orig`);
    if (!entries || entries.length === 0) {
      continue;
    }
    const track = entries.find((entry) => entry.url) || null;
    if (!track) {
      continue;
    }
    const segments = await downloadCaptionTrack(track.url);
    if (segments.length > 0) {
      payloadTracks.push({
        language: lang,
        name: track.name || lang,
        segments,
      });
    }
  }

  if (payloadTracks.length === 0) {
    return null;
  }

  return {
    source: 'yt-dlp',
    tracks: payloadTracks,
  };
}

async function downloadCaptionTrack(baseUrl) {
  try {
    if (!baseUrl) {
      return [];
    }
    const captionUrl = new URL(baseUrl);
    captionUrl.searchParams.set('fmt', 'json3');
    const response = await fetch(captionUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      return [];
    }
    const json = await response.json().catch(() => null);
    if (!json?.events) {
      return [];
    }
    return parseEvents(json.events);
  } catch (err) {
    console.error('[subtitles] track download failed', err);
    return [];
  }
}

function parseEvents(events) {
  const segments = [];
  for (const event of events || []) {
    if (!event?.segs) {
      continue;
    }
    const text = event.segs.map((seg) => seg.utf8 || '').join('').trim();
    if (!text) {
      continue;
    }
    const start = ((event.tStartMs ?? 0) / 1000);
    const duration = ((event.dDurationMs ?? event.dur ?? 0) / 1000);
    segments.push({
      text,
      start,
      duration,
    });
  }
  return segments;
}

function extractTrackName(track) {
  if (track?.name?.simpleText) {
    return track.name.simpleText;
  }
  if (Array.isArray(track?.name?.runs)) {
    return track.name.runs.map((run) => run.text || '').join('').trim();
  }
  return track?.languageCode || track?.vssId || 'unknown';
}
