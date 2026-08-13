import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts a YouTube watch/short URL to an embed URL. Returns the original URL unchanged if not YouTube. */
export function toYouTubeEmbedUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const { hostname, pathname, searchParams } = parsed;
  const isYoutubeCom =
    hostname === 'www.youtube.com' ||
    hostname === 'youtube.com' ||
    hostname === 'www.youtube-nocookie.com' ||
    hostname === 'youtube-nocookie.com';
  const isYoutuBe = hostname === 'youtu.be';

  if (!isYoutubeCom && !isYoutuBe) return url;

  // Already an embed URL — leave untouched
  if (isYoutubeCom && pathname.startsWith('/embed/')) return url;

  let videoId: string | null = null;

  if (isYoutubeCom && pathname === '/watch') {
    videoId = searchParams.get('v');
  } else if (isYoutuBe) {
    videoId = pathname.slice(1); // remove leading /
  }

  if (!videoId) return url;

  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);

  // Convert t/start parameter to seconds
  const t = searchParams.get('t') ?? searchParams.get('start');
  if (t) {
    const seconds = parseYouTubeTimestamp(t);
    if (seconds > 0) embedUrl.searchParams.set('start', String(seconds));
  }

  return embedUrl.toString();
}

/** Parses a YouTube timestamp (e.g. "62s", "1m30s", "1h2m10s", "90") into seconds. */
function parseYouTubeTimestamp(t: string): number {
  // Pure number (already seconds)
  if (/^\d+$/.test(t)) return parseInt(t, 10);

  let seconds = 0;
  const hours = t.match(/(\d+)h/);
  const minutes = t.match(/(\d+)m/);
  const secs = t.match(/(\d+)s/);
  if (hours) seconds += parseInt(hours[1], 10) * 3600;
  if (minutes) seconds += parseInt(minutes[1], 10) * 60;
  if (secs) seconds += parseInt(secs[1], 10);
  return seconds;
}
