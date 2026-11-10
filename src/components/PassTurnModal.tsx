import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  nextPlayerName: string;
  onProceed: () => void;
}

export const PassTurnModal: React.FC<Props> = ({ nextPlayerName, onProceed }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 scanlines">
      <div className="w-full max-w-md p-6 rounded-2xl border border-cyan-500/50 bg-slate-900/95 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-500 flex items-center justify-center mx-auto mb-4 text-cyan-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="font-display font-bold text-xl uppercase tracking-wider text-slate-100 mb-1">
          CAMBIO DE MANDO NAVAL
        </h3>

        <p className="text-xs text-slate-400 font-mono-combat mb-6">
          Pasa el control a <span className="text-cyan-300 font-bold">{nextPlayerName}</span>. No mires las posiciones de los navíos enemigos.
        </p>

        <button
          type="button"
          onClick={onProceed}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-display font-bold text-sm tracking-wider uppercase bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <span>Estoy Listo para Disparar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
