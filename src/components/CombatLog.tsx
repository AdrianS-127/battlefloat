import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types/game';
import { Terminal, Crosshair, Droplet, Skull, Zap } from 'lucide-react';

interface Props {
  logs: LogEntry[];
  currentTurn: number;
}

export const CombatLog: React.FC<Props> = ({ logs, currentTurn }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border border-slate-800/80 rounded-xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-slate-200">
            Registro de Operaciones
          </span>
        </div>
        <div className="font-mono-combat text-[11px] text-cyan-300">
          TURNO {currentTurn}
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[170px] md:max-h-[220px] font-mono-combat text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 italic text-center py-4 text-xs">
            Sistemas armados. Esperando primera orden de disparo...
          </div>
        ) : (
          logs.map((log) => {
            const isPlayer = log.attacker === 'player' || log.attacker === 'player1';
            let icon = <Droplet className="w-3 h-3 text-sky-400 shrink-0" />;
            let badgeColor = 'text-sky-400';

            if (log.result === 'sunk') {
              icon = <Skull className="w-3 h-3 text-rose-500 shrink-0 animate-pulse" />;
              badgeColor = 'text-rose-400 font-bold';
            } else if (log.result === 'hit') {
              icon = <Crosshair className="w-3 h-3 text-amber-400 shrink-0" />;
              badgeColor = 'text-amber-300 font-semibold';
            } else if (log.result === 'ability') {
              icon = <Zap className="w-3 h-3 text-purple-400 shrink-0" />;
              badgeColor = 'text-purple-300';
            }

            return (
              <div
                key={log.id}
                className="flex items-start gap-1.5 py-1 px-1.5 rounded bg-slate-900/40 border border-slate-800/30 leading-snug"
              >
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className={isPlayer ? 'text-cyan-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {isPlayer ? 'COMANDANTE (ALIADO)' : 'FLOTA HOSTIL'}
                    </span>
                    <span className="text-slate-500">{log.timestamp}</span>
                  </div>
                  <div className={`text-xs ${badgeColor}`}>
                    {log.coord && <span className="text-slate-300 mr-1.5">[{log.coord}]</span>}
                    {log.detail}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
