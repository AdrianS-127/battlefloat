import React from 'react';
import { TacticalAbility } from '../types/game';
import { Radio, Crosshair, Navigation } from 'lucide-react';

export type AbilityType = 'sonar' | 'torpedo' | 'airstrike';

interface Props {
  abilities: TacticalAbility[];
  selectedAbility: AbilityType | null;
  onSelectAbility: (type: AbilityType | null) => void;
  isPlayerTurn: boolean;
}

export const TacticalAbilities: React.FC<Props> = ({
  abilities,
  selectedAbility,
  onSelectAbility,
  isPlayerTurn,
}) => {
  return (
    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
        <span className="font-display text-xs font-semibold uppercase tracking-wider text-slate-200">
          Soporte Táctico Especial
        </span>
        <span className="text-[10px] font-mono-combat text-cyan-400">
          {selectedAbility ? 'HABILIDAD ACTIVA' : 'SELECCIONA APOYO'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {abilities.map((ability) => {
          const isSelected = selectedAbility === ability.id;
          const isReady = ability.currentCooldown === 0 && ability.remainingUses > 0;
          const isDisabled = !isPlayerTurn || !isReady;

          let icon = <Radio className="w-4 h-4" />;
          if (ability.id === 'torpedo') icon = <Navigation className="w-4 h-4" />;
          if (ability.id === 'airstrike') icon = <Crosshair className="w-4 h-4" />;

          return (
            <button
              key={ability.id}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                onSelectAbility(isSelected ? null : ability.id);
              }}
              className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : isReady
                  ? 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:border-cyan-500 hover:text-white cursor-pointer'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={isSelected ? 'text-cyan-300' : isReady ? 'text-cyan-400' : 'text-slate-600'}>
                  {icon}
                </span>
                <span className="font-mono-combat text-[10px] font-semibold text-slate-400">
                  x{ability.remainingUses}
                </span>
              </div>

              <div>
                <div className="font-semibold text-xs leading-tight mb-0.5 truncate">
                  {ability.nameEs}
                </div>
                <div className="text-[10px] text-slate-400 font-mono-combat">
                  {ability.currentCooldown > 0 ? `CD: ${ability.currentCooldown}T` : 'LISTO'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
