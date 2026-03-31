import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetFooter,
} from '../../components/sheet';

describe('Sheet', () => {
  it('should not show content by default', () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.queryByText('Sheet Title')).not.toBeInTheDocument();
  });

  it('should show content when trigger is clicked', () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should render close button by default', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should hide close button when hideDefaultClose is true', () => {
    render(
      <Sheet open>
        <SheetContent hideDefaultClose>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('should render header and footer', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader data-testid="header">
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
          <SheetFooter data-testid="footer">
            <button>Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'sheet-header');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'sheet-footer');
  });
});
