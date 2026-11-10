import React from 'react';
import { PlayerStats } from '../types/game';
import { Trophy, Skull, RotateCcw, Home, Award } from 'lucide-react';

interface Props {
  isVictory: boolean;
  winnerName: string;
  stats: PlayerStats;
  enemyStats: PlayerStats;
  turnCount: number;
  onPlayAgain: () => void;
  onReturnToTitle: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  isVictory,
  winnerName,
  stats,
  turnCount,
  onPlayAgain,
  onReturnToTitle,
}) => {
  // Calculate naval rank grade
  const calcRank = (acc: number): { grade: string; title: string; color: string } => {
    if (acc >= 55) return { grade: 'S', title: 'Gran Almirante de la Flota', color: 'text-amber-400' };
    if (acc >= 42) return { grade: 'A', title: 'Capitán de Navío Superior', color: 'text-cyan-400' };
    if (acc >= 30) return { grade: 'B', title: 'Comandante Táctico', color: 'text-emerald-400' };
    return { grade: 'C', title: 'Oficial de Artillería', color: 'text-slate-400' };
  };

  const rank = calcRank(stats.accuracy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md scanlines animate-fadeIn">
      <div
        className={`w-full max-w-lg p-6 md:p-8 rounded-2xl border text-center relative overflow-hidden backdrop-blur-xl ${
          isVictory
            ? 'bg-slate-950/90 border-cyan-500/80 naval-glow-cyan'
            : 'bg-slate-950/90 border-rose-600/80 naval-glow-red'
        }`}
      >
        {/* Glow ambient accent */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30 ${
            isVictory ? 'bg-cyan-500' : 'bg-rose-600'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border ${
              isVictory
                ? 'bg-cyan-950/80 border-cyan-400/80 text-cyan-300'
                : 'bg-rose-950/80 border-rose-500/80 text-rose-300'
            }`}
          >
            {isVictory ? (
              <Trophy className="w-8 h-8 text-amber-400" />
            ) : (
              <Skull className="w-8 h-8 text-rose-500" />
            )}
          </div>

          <h2
            className={`font-display font-black text-2xl md:text-3xl tracking-widest uppercase mb-1 ${
              isVictory ? 'text-cyan-300' : 'text-rose-400'
            }`}
          >
            {isVictory ? '¡VICTORIA NAVAL DECISIVA!' : '¡FLOTA ALIADA DERROTADA!'}
          </h2>

          <div className="font-mono-combat text-xs text-slate-400 uppercase tracking-wider">
            {isVictory
              ? `${winnerName} ha destruido toda la flota enemiga`
              : 'Nuestros navíos han sido hundidos por el fuego enemigo'}
          </div>
        </div>

        {/* Rank & Stats Summary */}
        <div className="relative z-10 bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-left">
              <Award className={`w-5 h-5 ${rank.color}`} />
              <div>
                <div className="text-xs font-mono-combat text-slate-400">RANGO MILITAR ASIGNADO</div>
                <div className={`font-display font-bold text-sm ${rank.color}`}>{rank.title}</div>
              </div>
            </div>
            <div className={`font-display font-black text-3xl ${rank.color}`}>
              {rank.grade}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono-combat">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] text-slate-400">PRECISIÓN</div>
              <div className="text-base font-bold text-cyan-400">{stats.accuracy}%</div>
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] text-slate-400">DISPAROS</div>
              <div className="text-base font-bold text-slate-200">{stats.shotsFired}</div>
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] text-slate-400">IMPACTOS</div>
              <div className="text-base font-bold text-rose-400">{stats.hits}</div>
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-[10px] text-slate-400">RONDAS</div>
              <div className="text-base font-bold text-slate-200">{turnCount}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar de Nuevo</span>
          </button>

          <button
            type="button"
            onClick={onReturnToTitle}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Menú Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
