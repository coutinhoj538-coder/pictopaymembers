export const CHECKOUT_URL = 'https://pictopay.lovable.app/';

export function metadata(title: string, description: string) {
  return { meta: [{ title: `${title} · Área de alunos` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} · Área de alunos` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}

function isYouTubeHost(host: string) {
  return ["youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host);
}

export function youtubeVideoId(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !isYouTubeHost(url.hostname)) return null;
  const [, route, segment, extra] = url.pathname.split("/");
  const id = url.hostname === "youtu.be"
    ? (!segment ? route : null)
    : url.pathname === "/watch"
      ? url.searchParams.get("v")
      : route && ["embed", "shorts", "live"].includes(route) && !extra ? segment : null;
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function validateVideoUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Use uma URL HTTPS de reprodução direta.');
  if (isYouTubeHost(url.hostname) && !youtubeVideoId(value)) {
    throw new Error("Cole um link do YouTube que aponte para um vídeo individual.");
  }
  return url.href;
}

export function purchaseGrantsAccess(status: string, purchaseEmail: string, accountEmail: string, emailConfirmed: boolean) {
  return emailConfirmed && status === 'approved' && purchaseEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase();
}
