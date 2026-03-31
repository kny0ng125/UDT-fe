import { getYouTubeEmbedUrl } from '../../utils/getYouTubeEmbedUrl';

describe('getYouTubeEmbedUrl', () => {
  const expectedParams =
    'autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0&modestbranding=1&rel=0&showinfo=0';

  it('should extract video ID from youtube.com/watch?v= URL', () => {
    const result = getYouTubeEmbedUrl(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(result).toBe(
      `https://www.youtube.com/embed/dQw4w9WgXcQ?${expectedParams}`,
    );
  });

  it('should extract video ID from youtu.be/ short URL', () => {
    const result = getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toBe(
      `https://www.youtube.com/embed/dQw4w9WgXcQ?${expectedParams}`,
    );
  });

  it('should extract video ID from youtube.com/embed/ URL', () => {
    const result = getYouTubeEmbedUrl(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
    expect(result).toBe(
      `https://www.youtube.com/embed/dQw4w9WgXcQ?${expectedParams}`,
    );
  });

  it('should handle URLs with extra query parameters', () => {
    const result = getYouTubeEmbedUrl(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
    );
    expect(result).toBe(
      `https://www.youtube.com/embed/dQw4w9WgXcQ?${expectedParams}`,
    );
  });

  it('should return empty string for empty input', () => {
    expect(getYouTubeEmbedUrl('')).toBe('');
  });

  it('should return empty string for invalid URL', () => {
    expect(getYouTubeEmbedUrl('https://example.com/video')).toBe('');
  });
});
