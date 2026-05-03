/**
 * Built at dev/build time from every image in `public/photos/`.
 * Do not edit by hand — add/remove files in that folder.
 */
export function photoManifestUrl(): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}photo-manifest.json`;
}

/** Add `public/audio/song.mp3` before deploy, or swap the filename here. */
export const BIRTHDAY_AUDIO_PATH = "/audio/song.mp3";

/** Footer date — fixed text only; change here if you want a different day on screen. */
export const CELEBRATION_DATE_DISPLAY = "Sunday, 3 May 2026";
export const CELEBRATION_DATE_ISO = "2026-05-03";
