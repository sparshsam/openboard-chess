import { useMemo, useState, useEffect } from 'react';
import Board from '../components/Board/Board';
import MoveHistory from '../components/Game/MoveHistory';
import StatusBar from '../components/Game/StatusBar';
import GameControls from '../components/GameControls/GameControls';
import PromotionDialog from '../components/PromotionDialog/PromotionDialog';
import SettingsPanel from '../components/Settings/SettingsPanel';
import CapturedPieces from '../components/CapturedPieces/CapturedPieces';
import { useChessGame } from '../hooks/useChessGame';
import { useSettings } from '../hooks/useSettings';
import { isDebugEnabled, getDebugInfo, type EngineDebugInfo } from '../chess/engineDebug';
import './App.css';
import '../components/Settings/SettingsPanel.css';

export default function App() {
  const {
    settings,
    settingsOpen,
    setGameMode,
    setDifficulty,
    setBoardOrientation,
    setBoardTheme,
    setPieceSet,
    setSoundEnabled,
    toggleSettings,
  } = useSettings();

  const {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    isComputerThinking,
    gameResult,
    reviewMode,
    reviewIndex,
    stockfishStatus,
    stockfishError,
    stockfishProgress,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
    undoMove,
    resign,
    exportPgn,
    capturedPieces,
    enterReviewMode,
    exitReviewMode,
    goToMove,
  } = useChessGame({ settings });

  const [engineDebug, setEngineDebug] = useState<Partial<EngineDebugInfo> | null>(null);

  useEffect(() => {
    if (!isDebugEnabled()) return;
    const interval = setInterval(() => {
      const info = getDebugInfo();
      if (info) setEngineDebug(info);
    }, 500);
    return () => clearInterval(interval);
  }, [isComputerThinking, history]);

  const captured = useMemo(() => capturedPieces(), [capturedPieces]);

  const canUndo = history.length > 0;
  const canResign = !gameResult && !game.isGameOver() && history.length > 0;
  const isNightmare =
    settings.gameMode === 'computer' && settings.difficulty === 'nightmare';

  const pieceSetClass = 'piece-set-active-' + settings.pieceSet;
  const boardThinkingClass = isComputerThinking ? ' board-computer-thinking' : '';

  return (
    <div className={'app ' + pieceSetClass}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <h1>Chess by Sparsh</h1>
        <span className="piece-set-badge" title="Active piece set">
          {settings.pieceSet}
        </span>
        <button className="settings-toggle-btn" onClick={toggleSettings} aria-label="Open settings">
          &#9881; Settings
        </button>
      </header>

      <main id="main-content" className="app-main">
        <div className="game-layout">
          <div className={'board-section' + boardThinkingClass}>
            <CapturedPieces
              whiteCaptured={captured.white}
              blackCaptured={captured.black}
            />
            <Board
              game={game}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={selectSquare}
              boardTheme={settings.boardTheme}
              pieceSet={settings.pieceSet}
              isComputerThinking={isComputerThinking}
            />
            <StatusBar
              status={status}
              fen={fen}
              gameMode={settings.gameMode}
              isComputerThinking={isComputerThinking}
              stockfishStatus={stockfishStatus}
              stockfishError={stockfishError}
              stockfishProgress={stockfishProgress}
              isNightmare={isNightmare}
            />
          </div>

          <div className="sidebar">
            <GameControls
              onNewGame={newGame}
              onExportFen={exportFen}
              onImportFen={importFen}
              onUndo={undoMove}
              onResign={resign}
              onExportPgn={exportPgn}
              canUndo={canUndo}
              canResign={canResign}
            />
            <MoveHistory
              history={history}
              reviewMode={reviewMode}
              reviewIndex={reviewIndex}
              onGoToMove={goToMove}
              onEnterReview={enterReviewMode}
              onExitReview={exitReviewMode}
            />
          </div>
        </div>
      </main>

      {pendingPromotion && (
        <PromotionDialog
          color={game.turn()}
          onPromote={promote}
          onCancel={cancelPromotion}
        />
      )}

      <SettingsPanel
        settings={settings}
        isOpen={settingsOpen}
        onClose={toggleSettings}
        onGameModeChange={setGameMode}
        onDifficultyChange={setDifficulty}
        onBoardOrientationChange={setBoardOrientation}
        onBoardThemeChange={setBoardTheme}
        onPieceSetChange={setPieceSet}
        onSoundEnabledChange={setSoundEnabled}
      />
      {engineDebug && (
        <div style={{
          position: 'fixed', bottom: 8, left: 8,
          fontSize: '11px', fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.75)', color: '#0f0',
          padding: '6px 10px', borderRadius: 4, zIndex: 999,
          maxWidth: 300, lineHeight: 1.4
        } as React.CSSProperties}>
          {engineDebug.difficulty} | depth {engineDebug.depthReached}/{engineDebug.maxDepth} |
          {' '}{engineDebug.nodesSearched} nodes | score {engineDebug.bestScore}cp |
          {' '}{engineDebug.openingBookHit ? '📖' : ''} {engineDebug.quiescenceUsed ? '🔍' : ''} {engineDebug.transpositionTableUsed ? '🗄️' : ''}
        </div>
      )}
    </div>
  );
}

