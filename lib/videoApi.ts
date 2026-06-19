export const VIDEO_API_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEO_API_BASE_URL?.replace(/\/$/, '') ||
  'https://video-api.zood.work';

export function videoApiUrl(path: string) {
  return `${VIDEO_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
