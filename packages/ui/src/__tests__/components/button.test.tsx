import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../../components/button';

describe('Button', () => {
  it('should render with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should have data-slot="button"', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should render as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/link">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/link');
  });

  it('should forward ref and additional props', () => {
    render(<Button data-testid="my-btn" type="submit">Submit</Button>);
    const button = screen.getByTestId('my-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
