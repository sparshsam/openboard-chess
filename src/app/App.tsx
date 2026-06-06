import { useMemo } from 'react';
import Board from '../components/Board/Board';
import MoveHistory from '../components/Game/MoveHistory';
import StatusBar from '../components/Game/StatusBar';
import GameControls from '../components/GameControls/GameControls';
import PromotionDialog from '../components/PromotionDialog/PromotionDialog';
import SettingsPanel from '../components/Settings/SettingsPanel';
import CapturedPieces from '../components/CapturedPieces/CapturedPieces';
import { useChessGame } from '../hooks/useChessGame';
import { useSettings } from '../hooks/useSettings';
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

  const captured = useMemo(() => capturedPieces(), [capturedPieces]);

  const canUndo = history.length > 0;
  const canResign = !gameResult && !game.isGameOver() && history.length > 0;
  const isNightmare =
    settings.gameMode === 'computer' && settings.difficulty === 'nightmare';

  return (
    <div className={'app piece-set-active-' + settings.pieceSet}>
      <header className="app-header">
        <h1>Chess by Sparsh</h1>
        <button className="settings-toggle-btn" onClick={toggleSettings} aria-label="Open settings">
          &#9881; Settings
        </button>
      </header>

      <main className="app-main">
        <div className="game-layout">
          <div className="board-section">
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
    </div>
  );
}
