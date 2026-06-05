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

  it('renders the board', () => {
    render(<App />);
    // Board squares should be rendered
    const squares = document.querySelectorAll('.square');
    expect(squares.length).toBe(64);
  });

  it('renders mode selector with both modes', () => {
    render(<App />);
    expect(screen.getByText('User vs Computer')).toBeDefined();
    expect(screen.getByText('Local Two Player')).toBeDefined();
  });

  it('renders difficulty selector with all three options', () => {
    render(<App />);
    expect(screen.getByText('Easy')).toBeDefined();
    expect(screen.getByText('Medium')).toBeDefined();
    expect(screen.getByText('Hard')).toBeDefined();
  });

  it('renders move history section', () => {
    render(<App />);
    expect(screen.getByText('Moves')).toBeDefined();
  });

  it('renders New Game button', () => {
    render(<App />);
    expect(screen.getByText('New Game')).toBeDefined();
  });

  it('renders FEN buttons', () => {
    render(<App />);
    expect(screen.getByText('Copy FEN')).toBeDefined();
    expect(screen.getByText('Import FEN')).toBeDefined();
  });

  it('default mode is User vs Computer (selected)', () => {
    render(<App />);
    const pvcBtn = screen.getByText('User vs Computer');
    expect(pvcBtn.className).toContain('mode-btn-active');
  });

  it('default difficulty is Easy (selected)', () => {
    render(<App />);
    const easyBtn = screen.getByText('Easy');
    expect(easyBtn.className).toContain('mode-btn-active');
  });

  it('can switch to Local Two Player mode', () => {
    render(<App />);
    const pvpBtn = screen.getByText('Local Two Player');
    fireEvent.click(pvpBtn);
    expect(pvpBtn.className).toContain('mode-btn-active');

    // User vs Computer should no longer be active
    const pvcBtn = screen.getByText('User vs Computer');
    expect(pvcBtn.className).not.toContain('mode-btn-active');
  });

  it('can switch difficulty to Medium and Hard', () => {
    render(<App />);
    const mediumBtn = screen.getByText('Medium');
    const hardBtn = screen.getByText('Hard');

    fireEvent.click(mediumBtn);
    expect(mediumBtn.className).toContain('mode-btn-active');
    expect(hardBtn.className).not.toContain('mode-btn-active');

    fireEvent.click(hardBtn);
    expect(hardBtn.className).toContain('mode-btn-active');
    expect(mediumBtn.className).not.toContain('mode-btn-active');
  });

  it('renders status bar', () => {
    render(<App />);
    expect(screen.getByText('White to move')).toBeDefined();
  });

  it('import FEN shows input on click', () => {
    render(<App />);
    const importBtn = screen.getByText('Import FEN');
    fireEvent.click(importBtn);
    expect(screen.getByPlaceholderText('Paste FEN string...')).toBeDefined();
    expect(screen.getByText('Load')).toBeDefined();
  });
});
