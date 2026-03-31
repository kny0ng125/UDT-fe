import { checkImgSrcValidity } from '../../utils/checkImgSrcValidity';

describe('checkImgSrcValidity', () => {
  it('should return true for relative paths starting with /', () => {
    expect(checkImgSrcValidity('/images/photo.png')).toBe(true);
    expect(checkImgSrcValidity('/')).toBe(true);
  });

  it('should return true for http:// URLs', () => {
    expect(checkImgSrcValidity('http://example.com/img.jpg')).toBe(true);
  });

  it('should return true for https:// URLs', () => {
    expect(checkImgSrcValidity('https://example.com/img.jpg')).toBe(true);
  });

  it('should return false for undefined', () => {
    expect(checkImgSrcValidity(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(checkImgSrcValidity('')).toBe(false);
  });

  it('should return false for relative paths without leading /', () => {
    expect(checkImgSrcValidity('images/photo.png')).toBe(false);
  });

  it('should return false for data URIs', () => {
    expect(checkImgSrcValidity('data:image/png;base64,abc')).toBe(false);
  });
});
