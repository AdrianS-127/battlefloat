import React from 'react';
import { PlacedShip, SHIP_DEFINITIONS } from '../types/game';
import { Shield, Target, AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  ships: PlacedShip[];
  isEnemy: boolean;
  totalHits: number;
}

export const FleetStatus: React.FC<Props> = ({ title, ships, isEnemy, totalHits }) => {
  const aliveShips = ships.filter((s) => !s.sunk).length;
  const totalShips = ships.length || 5;

  return (
    <div
      className={`p-3 rounded-xl border backdrop-blur-md ${
        isEnemy
          ? 'bg-slate-950/70 border-rose-950/60'
          : 'bg-slate-950/70 border-cyan-950/60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {isEnemy ? (
            <Target className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="font-display text-xs font-bold tracking-wider uppercase text-slate-200">
            {title}
          </span>
        </div>
        <div className="font-mono-combat text-xs">
          <span className={aliveShips > 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {aliveShips}/{totalShips}
          </span>{' '}
          <span className="text-slate-500 text-[10px]">OPERATIVOS</span>
        </div>
      </div>

      {/* Ships list */}
      <div className="space-y-1.5">
        {SHIP_DEFINITIONS.map((def) => {
          const placedShip = ships.find((s) => s.type === def.type);
          const isSunk = placedShip ? placedShip.sunk : false;
          const hitsCount = placedShip ? placedShip.hits : 0;

          return (
            <div
              key={def.type}
              className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                isSunk
                  ? 'bg-rose-950/30 border border-rose-900/40 text-slate-500'
                  : 'bg-slate-900/40 border border-slate-800/40 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-[90px]">
                {isSunk && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                <span
                  className={`text-xs font-medium truncate ${
                    isSunk ? 'line-through text-rose-400/70' : 'text-slate-200'
                  }`}
                >
                  {def.nameEs}
                </span>
              </div>

              {/* Segments Display */}
              <div className="flex items-center gap-1">
                {Array.from({ length: def.size }).map((_, idx) => {
                  const isDamaged = idx < hitsCount;

                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3 rounded-[2px] transition-all ${
                        isSunk
                          ? 'bg-rose-900/80 border border-rose-700/60'
                          : isDamaged
                          ? 'bg-rose-500 border border-rose-400 shadow-sm shadow-rose-500/50'
                          : isEnemy
                          ? 'bg-slate-700 border border-slate-600'
                          : 'bg-cyan-500/80 border border-cyan-400/80 shadow-sm shadow-cyan-500/30'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total damage readout */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px] font-mono-combat text-slate-400">
        <span>IMPACTOS RECIBIDOS:</span>
        <span className="font-semibold text-rose-400">{totalHits}</span>
      </div>
    </div>
  );
};
