import { cn } from '../utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should resolve Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should resolve complex Tailwind conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('should handle empty call', () => {
    expect(cn()).toBe('');
  });

  it('should handle array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});
