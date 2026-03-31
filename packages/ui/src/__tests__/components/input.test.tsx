import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../../components/input';

describe('Input', () => {
  it('should render an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should have data-slot="input"', () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('data-slot', 'input');
  });

  it('should handle value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is passed', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should apply the type prop', () => {
    render(<Input type="password" data-testid="pw" />);
    expect(screen.getByTestId('pw')).toHaveAttribute('type', 'password');
  });

  it('should apply custom className', () => {
    render(<Input className="w-full" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('w-full');
  });
});
