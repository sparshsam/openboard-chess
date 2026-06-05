import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn(() => Promise.resolve()) },
});

describe('App Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('Chess by Sparsh')).toBeDefined();
  });

  it('renders the 64-square board', () => {
    render(<App />);
    const squares = document.querySelectorAll('.square');
    expect(squares.length).toBe(64);
  });

  it('default mode is User vs Computer', () => {
    render(<App />);
    const pvcBtn = screen.getByText('User vs Computer');
    expect(pvcBtn.className).toContain('mode-btn-active');
  });

  it('default difficulty is Beginner (~800)', () => {
    render(<App />);
    const beginnerBtn = screen.getByText('Beginner (~800)');
    expect(beginnerBtn.className).toContain('mode-btn-active');
  });

  it('renders all three difficulty options', () => {
    render(<App />);
    expect(screen.getByText('Beginner (~800)')).toBeDefined();
    expect(screen.getByText('Casual (~1000)')).toBeDefined();
    expect(screen.getByText('Club (~1400)')).toBeDefined();
  });

  it('renders the rating disclaimer', () => {
    render(<App />);
    expect(
      screen.getByText('Approximate skill bands, not official Elo ratings.')
    ).toBeDefined();
  });

  it('renders Local Two Player mode option', () => {
    render(<App />);
    expect(screen.getByText('Local Two Player')).toBeDefined();
  });

  it('can switch to Local Two Player mode', () => {
    render(<App />);
    const pvpBtn = screen.getByText('Local Two Player');
    fireEvent.click(pvpBtn);
    expect(pvpBtn.className).toContain('mode-btn-active');

    const pvcBtn = screen.getByText('User vs Computer');
    expect(pvcBtn.className).not.toContain('mode-btn-active');
  });

  it('can switch difficulty to Casual and Club', () => {
    render(<App />);
    const casualBtn = screen.getByText('Casual (~1000)');
    const clubBtn = screen.getByText('Club (~1400)');

    fireEvent.click(casualBtn);
    expect(casualBtn.className).toContain('mode-btn-active');
    expect(clubBtn.className).not.toContain('mode-btn-active');

    fireEvent.click(clubBtn);
    expect(clubBtn.className).toContain('mode-btn-active');
    expect(casualBtn.className).not.toContain('mode-btn-active');
  });

  it('renders game controls', () => {
    render(<App />);
    expect(screen.getByText('New Game')).toBeDefined();
    expect(screen.getByText('Copy FEN')).toBeDefined();
    expect(screen.getByText('Import FEN')).toBeDefined();
  });

  it('renders move history', () => {
    render(<App />);
    expect(screen.getByText('Moves')).toBeDefined();
  });

  it('import FEN shows input on click', () => {
    render(<App />);
    const importBtn = screen.getByText('Import FEN');
    fireEvent.click(importBtn);
    expect(screen.getByPlaceholderText('Paste FEN string...')).toBeDefined();
    expect(screen.getByText('Load')).toBeDefined();
  });

  it('FEN export copies to clipboard', () => {
    render(<App />);
    const copyBtn = screen.getByText('Copy FEN');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('new game button is clickable', () => {
    render(<App />);
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);
    // Should still render after reset
    expect(screen.getByText('New Game')).toBeDefined();
  });
});
