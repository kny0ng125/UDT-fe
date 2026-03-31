import { getPlatformLogo } from '../../utils/getPlatformLogo';

describe('getPlatformLogo', () => {
  it.each([
    ['넷플릭스', '/images/ott/netflix.webp'],
    ['티빙', '/images/ott/tving.webp'],
    ['디즈니+', '/images/ott/disneyPlus.webp'],
    ['웨이브', '/images/ott/wavve.webp'],
    ['왓챠', '/images/ott/watcha.webp'],
    ['쿠팡플레이', '/images/ott/coupangPlay.webp'],
  ])('should return logo path for %s', (platform, expected) => {
    expect(getPlatformLogo(platform)).toBe(expected);
  });

  it('should be case-insensitive (uppercase)', () => {
    expect(getPlatformLogo('넷플릭스')).toBe('/images/ott/netflix.webp');
  });

  it('should return undefined for unknown platform', () => {
    expect(getPlatformLogo('유튜브')).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    expect(getPlatformLogo('')).toBeUndefined();
  });
});
