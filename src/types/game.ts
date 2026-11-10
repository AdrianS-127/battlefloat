export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface ShipDefinition {
  type: ShipType;
  name: string;
  nameEs: string;
  size: number;
  iconName: string;
}

export const SHIP_DEFINITIONS: ShipDefinition[] = [
  { type: 'carrier', name: 'Aircraft Carrier', nameEs: 'Portaaviones', size: 5, iconName: 'carrier' },
  { type: 'battleship', name: 'Battleship', nameEs: 'Acorazado', size: 4, iconName: 'battleship' },
  { type: 'cruiser', name: 'Cruiser', nameEs: 'Crucero', size: 3, iconName: 'cruiser' },
  { type: 'submarine', name: 'Submarine', nameEs: 'Submarino', size: 3, iconName: 'submarine' },
  { type: 'destroyer', name: 'Destroyer', nameEs: 'Destructor', size: 2, iconName: 'destroyer' },
];

export interface PlacedShip {
  id: string;
  type: ShipType;
  name?: string;
  nameEs?: string;
  size: number;
  x: number; // 0-9 (col)
  y: number; // 0-9 (row)
  orientation: 'horizontal' | 'vertical';
  hits: number;
  sunk: boolean;
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface GridCell {
  x: number;
  y: number;
  state: CellState;
  shipId?: string;
  revealedBySonar?: boolean;
}

export type AIDifficulty = 'novice' | 'veteran' | 'admiral';

export type GameMode = 'classic' | 'salvo' | 'tactical';

export type GamePhase = 
  | 'TITLE'
  | 'SETUP'
  | 'PLAYING'
  | 'PASS_TURN'
  | 'VICTORY'
  | 'DEFEAT';

export interface ShotResult {
  x: number;
  y: number;
  hit: boolean;
  sunkShip?: PlacedShip;
  alreadyFired?: boolean;
}

export interface TacticalAbility {
  id: 'sonar' | 'airstrike' | 'torpedo';
  nameEs: string;
  nameEn: string;
  descEs: string;
  descEn: string;
  cooldownTurns: number;
  currentCooldown: number;
  maxUses: number;
  remainingUses: number;
  icon: string;
}

export interface LogEntry {
  id: string;
  turn: number;
  attacker: 'player' | 'enemy' | 'player1' | 'player2';
  coord: string; // e.g. "D-4"
  result: 'hit' | 'miss' | 'sunk' | 'ability';
  detail: string;
  timestamp: string;
}

export interface PlayerStats {
  shotsFired: number;
  hits: number;
  misses: number;
  shipsSunk: number;
  accuracy: number;
}
