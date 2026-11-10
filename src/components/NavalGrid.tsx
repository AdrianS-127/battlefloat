import React, { useState } from 'react';
import { GridCell, PlacedShip, ShipDefinition } from '../types/game';
import { GRID_SIZE, ROW_LABELS, COL_LABELS, canPlaceShip, getShipCoordinates } from '../logic/gameLogic';
import { Crosshair, Flame, Droplets, Radio, Shield, Target } from 'lucide-react';

interface Props {
  title: string;
  grid: GridCell[][];
  ships: PlacedShip[];
  isInteractive: boolean;
  showShips: boolean;
  onCellClick?: (x: number, y: number, event: React.MouseEvent<HTMLButtonElement>) => void;
  // Placement props
  placementMode?: boolean;
  selectedShipDef?: ShipDefinition | null;
  orientation?: 'horizontal' | 'vertical';
  existingShips?: PlacedShip[];
  onPlaceShip?: (x: number, y: number) => void;
  onRemoveShip?: (shipId: string) => void;
  radarType?: 'friendly' | 'enemy';
}

export const NavalGrid: React.FC<Props> = ({
  title,
  grid,
  ships,
  isInteractive,
  showShips,
  onCellClick,
  placementMode = false,
  selectedShipDef,
  orientation = 'horizontal',
  existingShips = [],
  onPlaceShip,
  onRemoveShip,
  radarType = 'enemy',
}) => {
  const [hoveredCoord, setHoveredCoord] = useState<{ x: number; y: number } | null>(null);

  // Check if placement hover is valid
  const isHoverPlacementValid =
    placementMode &&
    selectedShipDef &&
    hoveredCoord &&
    canPlaceShip(
      selectedShipDef.size,
      hoveredCoord.x,
      hoveredCoord.y,
      orientation,
      existingShips
    );

  // Get coordinates preview for placement
  const placementPreviewCoords: { x: number; y: number }[] = [];
  if (placementMode && selectedShipDef && hoveredCoord) {
    for (let i = 0; i < selectedShipDef.size; i++) {
      if (orientation === 'horizontal') {
        placementPreviewCoords.push({ x: hoveredCoord.x + i, y: hoveredCoord.y });
      } else {
        placementPreviewCoords.push({ x: hoveredCoord.x, y: hoveredCoord.y + i });
      }
    }
  }

  // Map each placed ship to its coordinates for hull rendering
  const shipSegmentsMap = new Map<string, { ship: PlacedShip; index: number; isBow: boolean; isStern: boolean }>();
  if (showShips) {
    for (const ship of ships) {
      const coords = getShipCoordinates(ship);
      coords.forEach((coord, index) => {
        const key = `${coord.x},${coord.y}`;
        shipSegmentsMap.set(key, {
          ship,
          index,
          isBow: index === 0,
          isStern: index === ship.size - 1,
        });
      });
    }
  }

  const handleCellClick = (x: number, y: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (placementMode) {
      if (selectedShipDef && onPlaceShip) {
        if (canPlaceShip(selectedShipDef.size, x, y, orientation, existingShips)) {
          onPlaceShip(x, y);
        }
      } else {
        // If clicking on an already placed ship without selecting a new one, remove it to reposition
        const cell = grid[y][x];
        if (cell.shipId && onRemoveShip) {
          onRemoveShip(cell.shipId);
        }
      }
      return;
    }

    if (isInteractive && onCellClick) {
      const cell = grid[y][x];
      if (cell.state !== 'hit' && cell.state !== 'miss') {
        onCellClick(x, y, e);
      }
    }
  };

  const isEnemy = radarType === 'enemy';

  return (
    <div className="flex flex-col items-center">
      {/* Grid Header Info */}
      <div className="w-full flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {isEnemy ? (
            <Target className="w-4 h-4 text-rose-400" />
          ) : (
            <Shield className="w-4 h-4 text-cyan-400" />
          )}
          <span className="font-display font-semibold text-xs tracking-wider uppercase text-slate-200">
            {title}
          </span>
        </div>
        <div className="font-mono-combat text-xs text-slate-400">
          {hoveredCoord ? (
            <span className="text-cyan-300">
              LOC: [{ROW_LABELS[hoveredCoord.y]}-{COL_LABELS[hoveredCoord.x]}]
            </span>
          ) : (
            <span>10×10 SECTOR</span>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div
        className={`relative p-2 md:p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border ${
          isEnemy ? 'border-rose-950/60 naval-glow-red' : 'border-cyan-950/60 naval-glow-cyan'
        }`}
      >
        {/* Radar ambient scan effect overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-20">
          <div className="w-[140%] h-[140%] -top-[20%] -left-[20%] absolute rounded-full border border-cyan-500/30 animate-radar-sweep" />
        </div>

        {/* Column Labels (1 to 10) */}
        <div className="grid grid-cols-[24px_repeat(10,minmax(26px,38px))] md:grid-cols-[28px_repeat(10,minmax(32px,44px))] gap-1 mb-1 text-center font-mono-combat text-xs text-slate-400">
          <div className="flex items-center justify-center font-semibold text-slate-400">#</div>
          {COL_LABELS.map((col) => (
            <div key={col} className="flex items-center justify-center font-semibold">
              {col}
            </div>
          ))}
        </div>

        {/* Rows (A to J) and Cells */}
        <div className="flex flex-col gap-1">
          {ROW_LABELS.map((rowLabel, y) => (
            <div
              key={rowLabel}
              className="grid grid-cols-[24px_repeat(10,minmax(26px,38px))] md:grid-cols-[28px_repeat(10,minmax(32px,44px))] gap-1"
            >
              {/* Row Header */}
              <div className="flex items-center justify-center font-mono-combat text-xs font-semibold text-slate-400">
                {rowLabel}
              </div>

              {/* Grid Cells */}
              {Array.from({ length: GRID_SIZE }).map((_, x) => {
                const cell = grid[y][x];
                const coordKey = `${x},${y}`;
                const shipSegment = shipSegmentsMap.get(coordKey);
                const isPreview = placementPreviewCoords.some((c) => c.x === x && c.y === y);
                const isHovered = hoveredCoord?.x === x && hoveredCoord?.y === y;

                const isHit = cell.state === 'hit';
                const isMiss = cell.state === 'miss';
                const isAlreadyFired = isHit || isMiss;

                // Visual styling calculation
                let cellBg = 'bg-slate-900/70 border-slate-800/80 hover:border-cyan-500/50';

                if (isHit) {
                  cellBg = 'bg-rose-950/80 border-rose-600 shadow-inner shadow-rose-900/50 text-rose-300';
                } else if (isMiss) {
                  cellBg = 'bg-sky-950/40 border-sky-800/60 text-sky-400';
                } else if (isPreview) {
                  cellBg = isHoverPlacementValid
                    ? 'bg-emerald-600/40 border-emerald-400 animate-pulse text-emerald-200'
                    : 'bg-rose-600/40 border-rose-400 animate-pulse text-rose-200';
                } else if (shipSegment && showShips) {
                  if (shipSegment.ship.sunk) {
                    cellBg = 'bg-zinc-800/90 border-zinc-600 text-zinc-400';
                  } else {
                    cellBg = 'bg-cyan-950/90 border-cyan-500/70 text-cyan-200 shadow-sm shadow-cyan-900/40';
                  }
                } else if (cell.revealedBySonar) {
                  cellBg = 'bg-amber-950/50 border-amber-500/70 text-amber-300 animate-pulse';
                }

                return (
                  <button
                    key={x}
                    type="button"
                    disabled={(!isInteractive && !placementMode) || (isInteractive && isAlreadyFired)}
                    onClick={(e) => handleCellClick(x, y, e)}
                    onMouseEnter={() => setHoveredCoord({ x, y })}
                    onMouseLeave={() => setHoveredCoord(null)}
                    aria-label={`Sector ${rowLabel}-${x + 1}`}
                    className={`relative aspect-square rounded-md border transition-all duration-150 flex items-center justify-center overflow-hidden text-xs font-mono select-none ${cellBg} ${
                      isInteractive && !isAlreadyFired
                        ? 'cursor-crosshair hover:scale-[1.08] hover:z-20 hover:border-rose-400 active:scale-95'
                        : placementMode
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    {/* Background subtle radar cross grid */}
                    <span className="absolute inset-0 border border-white/[0.02] pointer-events-none" />

                    {/* Ship Segment Graphic if visible */}
                    {shipSegment && showShips && !isHit && (
                      <div className="absolute inset-1 flex items-center justify-center">
                        <div
                          className={`w-full h-full rounded ${
                            shipSegment.ship.sunk ? 'bg-zinc-700/60' : 'bg-cyan-600/50'
                          } flex items-center justify-center text-[10px] text-cyan-100 font-bold`}
                        >
                          {shipSegment.isBow ? '▲' : shipSegment.isStern ? '■' : '●'}
                        </div>
                      </div>
                    )}

                    {/* Hit Graphic */}
                    {isHit && (
                      <div className="flex flex-col items-center justify-center animate-bounce">
                        <Flame className="w-4 h-4 text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      </div>
                    )}

                    {/* Miss Graphic */}
                    {isMiss && (
                      <div className="flex items-center justify-center">
                        <Droplets className="w-3.5 h-3.5 text-sky-400/80" />
                      </div>
                    )}

                    {/* Sonar Recon Indicator */}
                    {cell.revealedBySonar && !isAlreadyFired && (
                      <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    )}

                    {/* Hover Reticle for Enemy Waters */}
                    {isInteractive && !isAlreadyFired && isHovered && (
                      <Crosshair className="w-4 h-4 text-rose-400 animate-reticle pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
