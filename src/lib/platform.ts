export const CHECKOUT_URL = 'https://pictopay.lovable.app/';

export function metadata(title: string, description: string) {
  return { meta: [{ title: `${title} · Área de alunos` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} · Área de alunos` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}

export function validateVideoUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Use uma URL HTTPS de reprodução direta.');
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')) throw new Error('O YouTube não permite esta experiência. Use um vídeo MP4 ou WebM com reprodução direta.');
  return url.href;
}

export function purchaseGrantsAccess(status: string, purchaseEmail: string, accountEmail: string, emailConfirmed: boolean) {
  return emailConfirmed && status === 'approved' && purchaseEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase();
}