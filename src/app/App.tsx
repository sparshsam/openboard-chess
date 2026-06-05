import Board from '../components/Board/Board';
import MoveHistory from '../components/Game/MoveHistory';
import StatusBar from '../components/Game/StatusBar';
import GameControls from '../components/GameControls/GameControls';
import PromotionDialog from '../components/PromotionDialog/PromotionDialog';
import SettingsPanel from '../components/Settings/SettingsPanel';
import { useChessGame } from '../hooks/useChessGame';
import { useSettings } from '../hooks/useSettings';
import './App.css';
import '../components/Settings/SettingsPanel.css';

export default function App() {
  const { settings, settingsOpen, setGameMode, setDifficulty, setBoardOrientation, toggleSettings } = useSettings();

  const {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    isComputerThinking,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
  } = useChessGame({ settings });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chess by Sparsh</h1>
        <button className="settings-toggle-btn" onClick={toggleSettings} aria-label="Open settings">
          ⚙ Settings
        </button>
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
            <StatusBar
              status={status}
              fen={fen}
              gameMode={settings.gameMode}
              isComputerThinking={isComputerThinking}
            />
          </div>

          <div className="sidebar">
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

      <SettingsPanel
        settings={settings}
        isOpen={settingsOpen}
        onClose={toggleSettings}
        onGameModeChange={setGameMode}
        onDifficultyChange={setDifficulty}
        onBoardOrientationChange={setBoardOrientation}
      />
    </div>
  );
}
