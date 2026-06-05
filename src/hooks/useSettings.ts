import { useState, useCallback, useEffect } from 'react';
import type { AppSettings, GameMode, BoardOrientation } from '../types';
import type { Difficulty } from '../chess/difficulty';
import { loadSettings, saveSettings } from '../lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Persist settings on change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setGameMode = useCallback((gameMode: GameMode) => {
    setSettings((prev: AppSettings) => ({ ...prev, gameMode }));
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setSettings((prev: AppSettings) => ({ ...prev, difficulty }));
  }, []);

  const setBoardOrientation = useCallback((boardOrientation: BoardOrientation) => {
    setSettings((prev: AppSettings) => ({ ...prev, boardOrientation }));
  }, []);

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => !prev);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  return {
    settings,
    settingsOpen,
    setGameMode,
    setDifficulty,
    setBoardOrientation,
    toggleSettings,
    closeSettings,
  };
}
