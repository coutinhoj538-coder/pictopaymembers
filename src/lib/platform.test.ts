import { describe, expect, it } from 'vitest';
import { purchaseGrantsAccess, validateVideoUrl } from './platform';
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
  it('rejects YouTube instead of bypassing its required interface', () => {
    for (const url of ['https://youtube.com/watch?v=1', 'https://www.youtube.com/embed/1', 'https://youtu.be/1', 'https://www.youtube-nocookie.com/embed/1']) expect(() => validateVideoUrl(url)).toThrow();
    expect(validateVideoUrl('https://media.example.com/lesson.mp4')).toBe('https://media.example.com/lesson.mp4');
  });
});