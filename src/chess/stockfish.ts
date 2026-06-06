/**
 * Stockfish WASM engine wrapper.
 * Dynamically loaded (script tag) only when Nightmare difficulty is selected.
 * Uses the UCI protocol for communication.
 *
 * The stockfish.js / stockfish.wasm / stockfish.worker.js files are served
 * from /stockfish/ in the public directory so the Emscripten loader can
 * resolve the WASM binary and worker files via its own relative-path logic.
 */

export interface StockfishMove {
  from: string;
  to: string;
  promotion?: string;
}

export type StockfishEngineState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'searching'
  | 'error';

export interface StockfishCallbacks {
  onStateChange: (state: StockfishEngineState) => void;
  onBestMove: (move: StockfishMove) => void;
  onError: (error: string) => void;
  onProgress?: (info: {
    depth: number;
    score: number;
    pv?: string;
  }) => void;
}

/** The minimal interface we need from the Stockfish WASM module */
interface SFHandle {
  addMessageListener: (cb: (line: string) => void) => void;
  removeMessageListener: (cb: (line: string) => void) => void;
  postMessage: (cmd: string) => void;
}

declare global {
  var Stockfish: (() => Promise<SFHandle>) | undefined;
}

/**
 * Checks whether the browser supports SharedArrayBuffer (required by Stockfish WASM).
 * Lightweight — does not load any engine files.
 */
export function isWasmThreadsSupported(): boolean {
  try {
    // WebAssembly 1.0
    const source = Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
    if (
      typeof WebAssembly !== 'object' ||
      typeof WebAssembly.validate !== 'function'
    )
      return false;
    if (!WebAssembly.validate(source)) return false;

    // SharedArrayBuffer
    if (typeof SharedArrayBuffer !== 'function') return false;

    // Atomics
    if (typeof Atomics !== 'object') return false;

    // Shared memory
    const mem = new WebAssembly.Memory({
      shared: true,
      initial: 8,
      maximum: 16,
    });
    if (!(mem.buffer instanceof SharedArrayBuffer)) return false;

    // Growable shared memory
    try {
      mem.grow(8);
    } catch {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/** Load Stockfish from /stockfish/ via a script tag and return the engine handle */
function loadStockfishScript(): Promise<SFHandle> {
  return new Promise((resolve, reject) => {
    // Check if Stockfish is already globally available
    if (window.Stockfish) {
      window.Stockfish().then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = '/stockfish/stockfish.js';
    script.async = true;

    script.onload = () => {
      if (!window.Stockfish) {
        reject(new Error('Stockfish script loaded but Stockfish() not found on window'));
        return;
      }
      window.Stockfish().then(resolve).catch(reject);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Stockfish script from /stockfish/stockfish.js'));
    };

    document.head.appendChild(script);
  });
}

export class StockfishEngine {
  private sf: SFHandle | null = null;
  private state: StockfishEngineState = 'idle';
  private callbacks: StockfishCallbacks | null = null;
  private uciReady = false;

  /** Initialize Stockfish — called when Nightmare difficulty is selected */
  async init(callbacks: StockfishCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.setState('loading');

    try {
      // Load Stockfish via dynamic script tag — only happens when Nightmare is selected
      this.sf = await loadStockfishScript();

      this.sf.addMessageListener((line: string) => {
        this.handleUciMessage(line);
      });

      // Initialize UCI
      this.sf.postMessage('uci');

      // Wait for uciok
      await this.waitForMessage('uciok');

      // Configure
      this.sf.postMessage('setoption name Hash value 16');
      this.sf.postMessage('setoption name Threads value 1');
      this.sf.postMessage('isready');

      await this.waitForMessage('readyok');

      this.uciReady = true;
      this.setState('ready');
    } catch (err) {
      this.setState('error');
      this.callbacks?.onError(
        `Failed to load Stockfish: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /** Start searching for the best move in a position */
  search(fen: string, thinkTimeMs: number = 2000): void {
    if (this.state !== 'ready' || !this.sf) {
      this.callbacks?.onError('Engine not ready');
      return;
    }

    this.setState('searching');
    this.sf.postMessage(`position fen ${fen}`);
    this.sf.postMessage(`go movetime ${thinkTimeMs}`);
  }

  /** Stop the current search */
  stop(): void {
    if (this.sf) {
      this.sf.postMessage('stop');
    }
  }

  /** Terminate the engine and release resources */
  terminate(): void {
    this.stop();
    this.sf = null;
    this.uciReady = false;
    this.setState('idle');
  }

  /** Whether the engine is initialized and ready */
  get isReady(): boolean {
    return this.uciReady;
  }

  /** Current engine state */
  get currentState(): StockfishEngineState {
    return this.state;
  }

  private setState(state: StockfishEngineState): void {
    this.state = state;
    this.callbacks?.onStateChange(state);
  }

  private handleUciMessage(line: string): void {
    // Parse UCI output
    if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const moveStr = parts[1]; // e.g., "e2e4"
      if (!moveStr || moveStr === '(none)') {
        this.setState('ready');
        return;
      }
      const move: StockfishMove = {
        from: moveStr.substring(0, 2),
        to: moveStr.substring(2, 4),
        promotion: moveStr.length > 4 ? moveStr[4] : undefined,
      };

      this.setState('ready');
      this.callbacks?.onBestMove(move);
    }

    // Parse info lines for progress
    if (line.startsWith('info')) {
      const depthMatch = line.match(/depth (\d+)/);
      const scoreMatch = line.match(/score cp (-?\d+)/);
      const mateMatch = line.match(/score mate (-?\d+)/);
      const pvMatch = line.match(/pv (.+)/);

      if (depthMatch) {
        const depth = parseInt(depthMatch[1], 10);
        let score = 0;

        if (scoreMatch) {
          score = parseInt(scoreMatch[1], 10);
        } else if (mateMatch) {
          // Convert mate score to a large centipawn value
          const mateIn = parseInt(mateMatch[1], 10);
          score = mateIn > 0 ? 100000 - mateIn : -100000 - mateIn;
        }

        this.callbacks?.onProgress?.({
          depth,
          score,
          pv: pvMatch?.[1],
        });
      }
    }
  }

  private waitForMessage(target: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.sf) {
        resolve();
        return;
      }

      const handler = (line: string) => {
        if (line.includes(target)) {
          try {
            this.sf!.removeMessageListener(handler);
          } catch {
            // ignore if not supported
          }
          resolve();
        }
      };
      this.sf.addMessageListener(handler);

      // Fallback timeout (5s)
      setTimeout(() => {
        try {
          this.sf!.removeMessageListener(handler);
        } catch {
          // ignore
        }
        resolve();
      }, 5000);
    });
  }
}
