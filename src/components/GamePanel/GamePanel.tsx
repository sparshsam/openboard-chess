import { useState } from 'react';
import MoveHistory from '../Game/MoveHistory';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import type { StockfishStatus, MoveFeedback } from '../../types';
import './GamePanel.css';

interface GamePanelProps {
  /* Status */
  status: string;
  gameMode: 'computer' | 'local';
  isComputerThinking: boolean;
  stockfishStatus?: StockfishStatus;
  stockfishError?: string | null;
  stockfishProgress?: { depth: number; score: number } | null;

  /* Move History */
  history: string[];
  reviewMode: boolean;
  reviewIndex: number;
  moveFeedback: Map<number, MoveFeedback>;
  onGoToMove: (index: number) => void;
  onEnterReview: () => void;
  onExitReview: () => void;

  /* Game Actions */
  onNewGame: () => void;
  onUndo: () => void;
  onResign: () => void;
  canUndo: boolean;
  canResign: boolean;

  /* Flip Board */
  boardOrientation: 'white-bottom' | 'flip-turn';
  onFlipBoard: () => void;
}

export default function GamePanel({
  status,
  gameMode,
  isComputerThinking,
  stockfishStatus,
  stockfishError,
  stockfishProgress,
  history,
  reviewMode,
  reviewIndex,
  moveFeedback,
  onGoToMove,
  onEnterReview,
  onExitReview,
  onNewGame,
  onUndo,
  onResign,
  canUndo,
  canResign,
  boardOrientation,
  onFlipBoard,
}: GamePanelProps) {
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  // ── Status helper ──────────────────────────────────────────────
  const modeLabel = gameMode === 'computer' ? 'Computer' : 'Local 2P';
  const getThinkingLabel = () => {
    if (!isComputerThinking) return '';
    const isSfReady = stockfishStatus === 'ready' || stockfishStatus === 'loading';
    if (isSfReady && stockfishStatus === 'loading') return ' (Loading…)';
    if (isSfReady && stockfishProgress) {
      const s = stockfishProgress.score >= 0
        ? `+${(stockfishProgress.score / 100).toFixed(2)}`
        : `${(stockfishProgress.score / 100).toFixed(2)}`;
      return ` (d${stockfishProgress.depth} | ${s})`;
    }
    if (stockfishStatus === 'ready') return ' (thinking)';
    if (stockfishStatus === 'error') return ' (engine error)';
    return '';
  };

  return (
    <div className="game-panel">
      {/* ── Panel Status Header ────────────────────────────── */}
      <div className="panel-status">
        <span className="panel-mode">
          {modeLabel}
          {getThinkingLabel()}
          {isComputerThinking && <span className="thinking-dots" />}
        </span>
        <span className="panel-status-text">{status}</span>
        {stockfishStatus === 'error' && stockfishError && (
          <span className="panel-engine-error" title={stockfishError}>
            ⚠ Engine error
          </span>
        )}
      </div>

      {/* ── 1. Move List ───────────────────────────────────── */}
      <div className="panel-section panel-moves">
        <h3 className="panel-section-title">Moves</h3>
        <div className="panel-moves-inner">
          <MoveHistory
            history={history}
            reviewMode={reviewMode}
            reviewIndex={reviewIndex}
            moveFeedback={moveFeedback}
            onGoToMove={onGoToMove}
            onEnterReview={onEnterReview}
            onExitReview={onExitReview}
          />
        </div>
      </div>

      {/* ── 2. Analysis ────────────────────────────────────── */}
      <div className="panel-section panel-analysis">
        <h3 className="panel-section-title">Analysis</h3>
        {moveFeedback.size > 0 && (
          <div className="analysis-feedback-list">
            {Array.from(moveFeedback.values())
              .filter((f) => f.moveIndex >= 0)
              .slice(-10)
              .reverse()
              .map((f) => (
                <div key={f.moveIndex} className={`analysis-feedback-item tag-${f.tag}`}>
                  <span className="feedback-move-num">#{f.moveIndex + 1}</span>
                  <span className="feedback-tag">{f.tag}</span>
                  {f.centipawnLoss > 0 && (
                    <span className="feedback-cl">
                      {'−' + f.centipawnLoss.toFixed(1)}cp
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
        {moveFeedback.size === 0 && (
          <p className="panel-analysis-placeholder">
            Move quality analysis after your moves
          </p>
        )}
      </div>

      {/* ── 3. Game Actions ────────────────────────────────── */}
      <div className="panel-section panel-actions">
        <h3 className="panel-section-title">Game Actions</h3>
        <div className="panel-actions-grid">
          <button className="btn panel-action-btn" onClick={onNewGame}>
            New Game
          </button>

          <button
            className="btn btn-secondary panel-action-btn"
            onClick={onUndo}
            disabled={!canUndo}
          >
            Undo
          </button>

          <button
            className="btn btn-secondary panel-action-btn"
            onClick={onFlipBoard}
          >
            {boardOrientation === 'white-bottom' ? 'Flip Board' : 'Reset Board'}
          </button>

          <button
            className="btn btn-danger-outline panel-action-btn"
            onClick={() => setShowResignConfirm(true)}
            disabled={!canResign}
          >
            Resign
          </button>
        </div>
      </div>

      {/* ── Resign confirmation ───────────────────────────── */}
      {showResignConfirm && (
        <ConfirmDialog
          title="Resign Game"
          message="Are you sure you want to resign?"
          confirmLabel="Resign"
          cancelLabel="Cancel"
          onConfirm={() => {
            setShowResignConfirm(false);
            onResign();
          }}
          onCancel={() => setShowResignConfirm(false)}
        />
      )}
    </div>
  );
}
