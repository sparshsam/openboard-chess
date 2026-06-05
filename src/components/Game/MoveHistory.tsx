import { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  history: string[];
}

export default function MoveHistory({ history }: MoveHistoryProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history]);

  // Group moves into pairs (white, black)
  const rows: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="move-history">
      <h3 className="move-history-title">Moves</h3>
      <div className="move-history-list" ref={listRef}>
        {rows.length === 0 && <p className="move-history-empty">No moves yet</p>}
        {rows.map((row) => (
          <div key={row.num} className="move-row">
            <span className="move-number">{row.num}.</span>
            <span className="move-white">{row.white}</span>
            {row.black && <span className="move-black">{row.black}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
