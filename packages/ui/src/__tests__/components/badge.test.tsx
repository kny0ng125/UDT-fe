import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../../components/badge';

describe('Badge', () => {
  it('should render with text content', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should have data-slot="badge"', () => {
    render(<Badge>Tag</Badge>);
    expect(screen.getByText('Tag')).toHaveAttribute('data-slot', 'badge');
  });

  it('should render as span by default', () => {
    render(<Badge>Tag</Badge>);
    expect(screen.getByText('Tag').tagName).toBe('SPAN');
  });

  it('should render as child element when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/link">Link Badge</a>
      </Badge>,
    );
    const link = screen.getByRole('link', { name: 'Link Badge' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/link');
  });

  it('should apply custom className', () => {
    render(<Badge className="ml-2">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('ml-2');
  });
});
