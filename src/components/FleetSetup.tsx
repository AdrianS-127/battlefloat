import React, { useState, useEffect } from 'react';
import { PlacedShip, ShipDefinition, SHIP_DEFINITIONS } from '../types/game';
import { NavalGrid } from './NavalGrid';
import { soundManager } from '../audio/soundManager';
import { createEmptyGrid, populateGridWithShips, generateRandomFleet, canPlaceShip } from '../logic/gameLogic';
import { RotateCw, Shuffle, Trash2, ArrowRight, ShieldCheck, Ship } from 'lucide-react';

interface Props {
  playerName: string;
  onFleetReady: (ships: PlacedShip[]) => void;
  onBackToTitle: () => void;
}

export const FleetSetup: React.FC<Props> = ({
  playerName,
  onFleetReady,
  onBackToTitle,
}) => {
  const [ships, setShips] = useState<PlacedShip[]>([]);
  const [selectedShipDef, setSelectedShipDef] = useState<ShipDefinition | null>(SHIP_DEFINITIONS[0]);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Compute grid representation
  const grid = populateGridWithShips(createEmptyGrid(), ships);

  // Keybind 'R' to toggle orientation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setOrientation((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
        soundManager.playTacticalClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update selected ship when placed ships change
  useEffect(() => {
    // Pick first unplaced ship definition
    const unplaced = SHIP_DEFINITIONS.find((def) => !ships.some((s) => s.type === def.type));
    setSelectedShipDef(unplaced || null);
  }, [ships]);

  const handlePlaceShip = (x: number, y: number) => {
    if (!selectedShipDef) return;

    if (canPlaceShip(selectedShipDef.size, x, y, orientation, ships)) {
      const newShip: PlacedShip = {
        id: `${selectedShipDef.type}_${Date.now()}`,
        type: selectedShipDef.type,
        name: selectedShipDef.name,
        nameEs: selectedShipDef.nameEs,
        size: selectedShipDef.size,
        x,
        y,
        orientation,
        hits: 0,
        sunk: false,
      };

      setShips((prev) => [...prev, newShip]);
      soundManager.playTacticalClick();
    }
  };

  const handleRemoveShip = (shipId: string) => {
    const shipToRemove = ships.find((s) => s.id === shipId);
    if (shipToRemove) {
      setShips((prev) => prev.filter((s) => s.id !== shipId));
      const def = SHIP_DEFINITIONS.find((d) => d.type === shipToRemove.type);
      if (def) setSelectedShipDef(def);
      soundManager.playTacticalClick();
    }
  };

  const handleRandomize = () => {
    const randomFleet = generateRandomFleet();
    setShips(randomFleet);
    soundManager.playSonarPing();
  };

  const handleClear = () => {
    setShips([]);
    setSelectedShipDef(SHIP_DEFINITIONS[0]);
    soundManager.playTacticalClick();
  };

  const isFleetComplete = ships.length === SHIP_DEFINITIONS.length;

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 p-4 md:p-6 scanlines">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <img
          src="/src/assets/images/game_radar_war_room_1794097532567.jpg"
          alt="Centro de operaciones tácticas"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pb-4 border-b border-slate-800/80">
        <button
          type="button"
          onClick={onBackToTitle}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono-combat text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
        >
          ← Volver al Menú
        </button>

        <div className="text-center">
          <div className="font-display font-bold text-sm md:text-base tracking-wider text-cyan-400 uppercase">
            DESPLIEGUE DE FLOTA NAVAL
          </div>
          <div className="text-xs font-mono-combat text-slate-400">
            {playerName} · ASIGNACIÓN DE CUADRÍCULA
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono-combat">
          <span className="text-slate-400">ESTADO:</span>
          <span className={isFleetComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
            {ships.length}/5 NAVÍOS
          </span>
        </div>
      </header>

      {/* Main Placement Area */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6 my-auto max-w-5xl mx-auto w-full py-4">
        {/* The 10x10 Placement Grid */}
        <div className="shrink-0">
          <NavalGrid
            title="Cuadrícula Territorial Aliada"
            grid={grid}
            ships={ships}
            isInteractive={false}
            showShips={true}
            placementMode={true}
            selectedShipDef={selectedShipDef}
            orientation={orientation}
            existingShips={ships}
            onPlaceShip={handlePlaceShip}
            onRemoveShip={handleRemoveShip}
            radarType="friendly"
          />
        </div>

        {/* Fleet Control Panel & Ship Inventory */}
        <div className="w-full max-w-md flex flex-col gap-4">
          {/* Orientation & Quick Tools */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs font-mono-combat text-slate-400 uppercase">
              <span>Orientación del Navío</span>
              <span className="text-cyan-400 font-bold">Tecla [R]</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setOrientation('horizontal');
                  soundManager.playTacticalClick();
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  orientation === 'horizontal'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Horizontal (Este-Oeste)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrientation('vertical');
                  soundManager.playTacticalClick();
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  orientation === 'vertical'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Vertical (Norte-Sur)</span>
              </button>
            </div>

            {/* Quick Actions (Random & Clear) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Despliegue Aleatorio</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-rose-900/60 bg-rose-950/30 hover:bg-rose-900/40 text-xs font-medium text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Ship Selection List */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md">
            <div className="text-xs font-mono-combat text-slate-400 mb-2.5 uppercase tracking-wider">
              Flota de Combate
            </div>

            <div className="space-y-1.5">
              {SHIP_DEFINITIONS.map((def) => {
                const isPlaced = ships.some((s) => s.type === def.type);
                const isSelected = selectedShipDef?.type === def.type;

                return (
                  <button
                    key={def.type}
                    type="button"
                    onClick={() => {
                      if (isPlaced) {
                        // Find and remove so player can reposition
                        const ship = ships.find((s) => s.type === def.type);
                        if (ship) handleRemoveShip(ship.id);
                      } else {
                        setSelectedShipDef(def);
                        soundManager.playTacticalClick();
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                        : isPlaced
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-cyan-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Ship className={`w-4 h-4 ${isPlaced ? 'text-emerald-400' : 'text-cyan-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">{def.nameEs}</div>
                        <div className="text-[10px] text-slate-400 font-mono-combat">
                          {isPlaced ? 'Desplegado en aguas' : 'Pendiente de despliegue'}
                        </div>
                      </div>
                    </div>

                    {/* Ship size segments visual */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: def.size }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-[2px] ${
                            isPlaced
                              ? 'bg-emerald-500/80 border border-emerald-400'
                              : isSelected
                              ? 'bg-cyan-400 border border-cyan-300'
                              : 'bg-slate-700 border border-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ready to Battle Button */}
          <button
            type="button"
            disabled={!isFleetComplete}
            onClick={() => {
              if (isFleetComplete) {
                soundManager.playMissileLaunch();
                onFleetReady(ships);
              }
            }}
            className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-display font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-xl ${
              isFleetComplete
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/25 cursor-pointer active:scale-95'
                : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{isFleetComplete ? '¡Zafarrancho de Combate! (Iniciar)' : 'Posiciona Todos los Navíos'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Control Hint Line */}
      <footer className="relative z-10 py-3 text-center font-mono-combat text-xs text-slate-400 border-t border-slate-800/60">
        R Rotar · Clic en la cuadrícula para situar · Clic en navío colocado para reposicionar
      </footer>
    </div>
  );
};
