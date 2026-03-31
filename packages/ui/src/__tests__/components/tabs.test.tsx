import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/tabs';

describe('Tabs', () => {
  const renderTabs = () =>
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

  it('should render tab triggers', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
  });

  it('should show the default tab content', () => {
    renderTabs();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('should render tab2 content when value is tab2', () => {
    render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('should mark active tab with aria-selected', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('should have correct data-slot attributes', () => {
    renderTabs();
    expect(screen.getByRole('tablist')).toHaveAttribute('data-slot', 'tabs-list');
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
      'data-slot',
      'tabs-trigger',
    );
  });
});
