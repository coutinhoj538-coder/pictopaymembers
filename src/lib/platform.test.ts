import { describe, expect, it } from 'vitest';
import { purchaseGrantsAccess, validateVideoUrl, youtubeVideoId } from './platform';
describe('Purchase access rules', () => {
  it('grants access only for an approved purchase', () => {
    expect(purchaseGrantsAccess('approved', 'buyer@example.com', 'buyer@example.com', true)).toBe(true);
    for (const status of ['pending', 'rejected', 'refunded', 'cancelled']) expect(purchaseGrantsAccess(status, 'buyer@example.com', 'buyer@example.com', true)).toBe(false);
  });
  it('matches the purchase email with the confirmed account', () => {
    expect(purchaseGrantsAccess('approved', ' Buyer@example.com ', 'buyer@example.com', true)).toBe(true);
    expect(purchaseGrantsAccess('approved', 'buyer@example.com', 'other@example.com', true)).toBe(false);
    expect(purchaseGrantsAccess('approved', 'buyer@example.com', 'buyer@example.com', false)).toBe(false);
  });
});
describe('Custom player sources', () => {
  it('accepts individual YouTube videos and rejects malformed links', () => {
    for (const url of ['https://youtube.com/watch?v=1', 'https://www.youtube.com/embed/1', 'https://youtu.be/1', 'https://www.youtube-nocookie.com/embed/1']) expect(() => validateVideoUrl(url)).toThrow();
    for (const url of ['https://youtube.com/watch?v=M7lc1UVf-VE', 'https://youtu.be/M7lc1UVf-VE?t=10', 'https://www.youtube.com/shorts/M7lc1UVf-VE']) { expect(validateVideoUrl(url)).toBe(url); expect(youtubeVideoId(url)).toBe('M7lc1UVf-VE'); }
    expect(youtubeVideoId('https://youtube.com.example.org/watch?v=M7lc1UVf-VE')).toBeNull();
    expect(validateVideoUrl('https://media.example.com/lesson.mp4')).toBe('https://media.example.com/lesson.mp4');
  });
});