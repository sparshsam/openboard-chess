import Board from './components/Board';
import MoveHistory from './components/MoveHistory';
import GameControls from './components/GameControls';
import PromotionDialog from './components/PromotionDialog';
import StatusBar from './components/StatusBar';
import ModeSelector from './components/ModeSelector';
import { useChessGame } from './hooks/useChessGame';
import './App.css';

export default function App() {
  const {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    gameMode,
    difficulty,
    isThinking,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
    setGameMode,
    setDifficulty,
  } = useChessGame();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chess by Sparsh</h1>
      </header>

      <main className="app-main">
        <div className="game-layout">
          <div className="board-section">
            <Board
              game={game}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={selectSquare}
            />
            {isThinking && (
              <div className="thinking-indicator">
                <span className="thinking-dot" />
                Computer is thinking…
              </div>
            )}
            <StatusBar status={status} fen={fen} />
          </div>

          <div className="sidebar">
            <ModeSelector
              gameMode={gameMode}
              difficulty={difficulty}
              onGameModeChange={setGameMode}
              onDifficultyChange={setDifficulty}
            />
            <GameControls
              onNewGame={newGame}
              onExportFen={exportFen}
              onImportFen={importFen}
            />
            <MoveHistory history={history} />
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
    </div>
  );
}
