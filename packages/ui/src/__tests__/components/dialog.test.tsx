import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/dialog';

describe('Dialog', () => {
  it('should not show content by default', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });

  it('should show content when trigger is clicked', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should render close button by default', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should hide close button when showCloseButton is false', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('should render header and footer', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogFooter data-testid="footer">
            <button>OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'dialog-header');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'dialog-footer');
  });
});
