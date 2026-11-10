import { GridCell, PlacedShip, ShipDefinition, SHIP_DEFINITIONS, ShotResult, AIDifficulty } from '../types/game';

export const GRID_SIZE = 10;
export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        state: 'empty',
      });
    }
    grid.push(row);
  }
  return grid;
}

export function coordToString(x: number, y: number): string {
  const row = ROW_LABELS[y] || '?';
  const col = COL_LABELS[x] || '?';
  return `${row}-${col}`;
}

export function getShipCoordinates(ship: PlacedShip): { x: number; y: number }[] {
  const coords: { x: number; y: number }[] = [];
  for (let i = 0; i < ship.size; i++) {
    if (ship.orientation === 'horizontal') {
      coords.push({ x: ship.x + i, y: ship.y });
    } else {
      coords.push({ x: ship.x, y: ship.y + i });
    }
  }
  return coords;
}

export function canPlaceShip(
  size: number,
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical',
  existingShips: PlacedShip[],
  ignoreShipId?: string
): boolean {
  // Check bounds
  if (x < 0 || y < 0) return false;
  if (orientation === 'horizontal') {
    if (x + size > GRID_SIZE) return false;
  } else {
    if (y + size > GRID_SIZE) return false;
  }

  // Check collision with existing ships
  const newCoords: { x: number; y: number }[] = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'horizontal') {
      newCoords.push({ x: x + i, y });
    } else {
      newCoords.push({ x, y: y + i });
    }
  }

  for (const ship of existingShips) {
    if (ignoreShipId && ship.id === ignoreShipId) continue;
    const existingCoords = getShipCoordinates(ship);
    for (const nc of newCoords) {
      if (existingCoords.some((ec) => ec.x === nc.x && ec.y === nc.y)) {
        return false;
      }
    }
  }

  return true;
}

export function generateRandomFleet(defs: ShipDefinition[] = SHIP_DEFINITIONS): PlacedShip[] {
  const ships: PlacedShip[] = [];

  for (const def of defs) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      attempts++;
      const orientation: 'horizontal' | 'vertical' = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxX = orientation === 'horizontal' ? GRID_SIZE - def.size : GRID_SIZE - 1;
      const maxY = orientation === 'vertical' ? GRID_SIZE - def.size : GRID_SIZE - 1;

      const x = Math.floor(Math.random() * (maxX + 1));
      const y = Math.floor(Math.random() * (maxY + 1));

      if (canPlaceShip(def.size, x, y, orientation, ships)) {
        ships.push({
          id: `${def.type}_${Date.now()}_${Math.random()}`,
          type: def.type,
          name: def.name,
          nameEs: def.nameEs,
          size: def.size,
          x,
          y,
          orientation,
          hits: 0,
          sunk: false,
        });
        placed = true;
      }
    }
  }

  return ships;
}

export function populateGridWithShips(grid: GridCell[][], ships: PlacedShip[]): GridCell[][] {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

  for (const ship of ships) {
    const coords = getShipCoordinates(ship);
    for (const c of coords) {
      if (newGrid[c.y] && newGrid[c.y][c.x]) {
        // preserve hit or miss if already fired
        if (newGrid[c.y][c.x].state === 'empty') {
          newGrid[c.y][c.x].state = 'ship';
        }
        newGrid[c.y][c.x].shipId = ship.id;
      }
    }
  }

  return newGrid;
}

export function processShot(
  x: number,
  y: number,
  grid: GridCell[][],
  ships: PlacedShip[]
): {
  newGrid: GridCell[][];
  newShips: PlacedShip[];
  result: ShotResult;
} {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const newShips = ships.map((s) => ({ ...s }));

  const targetCell = newGrid[y][x];

  // Already attacked
  if (targetCell.state === 'hit' || targetCell.state === 'miss') {
    return {
      newGrid,
      newShips,
      result: { x, y, hit: targetCell.state === 'hit', alreadyFired: true },
    };
  }

  // Check if any ship is on this cell
  let hitShip: PlacedShip | undefined;
  for (const ship of newShips) {
    const coords = getShipCoordinates(ship);
    if (coords.some((c) => c.x === x && c.y === y)) {
      hitShip = ship;
      break;
    }
  }

  if (hitShip) {
    targetCell.state = 'hit';
    hitShip.hits += 1;
    let sunkShip: PlacedShip | undefined;

    if (hitShip.hits >= hitShip.size) {
      hitShip.sunk = true;
      sunkShip = hitShip;
    }

    return {
      newGrid,
      newShips,
      result: { x, y, hit: true, sunkShip },
    };
  } else {
    targetCell.state = 'miss';
    return {
      newGrid,
      newShips,
      result: { x, y, hit: false },
    };
  }
}

export function areAllShipsSunk(ships: PlacedShip[]): boolean {
  if (ships.length === 0) return false;
  return ships.every((s) => s.sunk);
}

// AI MOVE CALCULATOR
export function calculateAIMove(
  grid: GridCell[][],
  enemyShips: PlacedShip[],
  difficulty: AIDifficulty
): { x: number; y: number } {
  const unattackedCells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].state !== 'hit' && grid[y][x].state !== 'miss') {
        unattackedCells.push({ x, y });
      }
    }
  }

  if (unattackedCells.length === 0) {
    return { x: 0, y: 0 };
  }

  // 1. Check for unsunk hits to target (Target Mode)
  // Find cells that are 'hit' but belong to ships that are NOT yet sunk
  const unsunkHitCoords: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].state === 'hit') {
        const ship = enemyShips.find((s) => s.id === grid[y][x].shipId);
        if (ship && !ship.sunk) {
          unsunkHitCoords.push({ x, y });
        }
      }
    }
  }

  // Target Mode in effect if there are unsunk hits
  if (unsunkHitCoords.length > 0 && difficulty !== 'novice') {
    // If we have 2 or more hits on the same unsunk ship, we have line direction!
    if (unsunkHitCoords.length >= 2) {
      // Determine if horizontal or vertical
      const isHorizontal = unsunkHitCoords.every((c) => c.y === unsunkHitCoords[0].y);
      const isVertical = unsunkHitCoords.every((c) => c.x === unsunkHitCoords[0].x);

      const candidates: { x: number; y: number }[] = [];

      if (isHorizontal) {
        const y = unsunkHitCoords[0].y;
        const minX = Math.min(...unsunkHitCoords.map((c) => c.x));
        const maxX = Math.max(...unsunkHitCoords.map((c) => c.x));

        // Check left
        if (minX > 0 && grid[y][minX - 1].state !== 'hit' && grid[y][minX - 1].state !== 'miss') {
          candidates.push({ x: minX - 1, y });
        }
        // Check right
        if (maxX < GRID_SIZE - 1 && grid[y][maxX + 1].state !== 'hit' && grid[y][maxX + 1].state !== 'miss') {
          candidates.push({ x: maxX + 1, y });
        }
      } else if (isVertical) {
        const x = unsunkHitCoords[0].x;
        const minY = Math.min(...unsunkHitCoords.map((c) => c.y));
        const maxY = Math.max(...unsunkHitCoords.map((c) => c.y));

        // Check top
        if (minY > 0 && grid[minY - 1][x].state !== 'hit' && grid[minY - 1][x].state !== 'miss') {
          candidates.push({ x, y: minY - 1 });
        }
        // Check bottom
        if (maxY < GRID_SIZE - 1 && grid[maxY + 1][x].state !== 'hit' && grid[maxY + 1][x].state !== 'miss') {
          candidates.push({ x, y: maxY + 1 });
        }
      }

      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // Single hit or branching options: check adjacent orthagonals
    const adjacents: { x: number; y: number }[] = [];
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const hit of unsunkHitCoords) {
      for (const d of dirs) {
        const nx = hit.x + d.dx;
        const ny = hit.y + d.dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid[ny][nx].state !== 'hit' && grid[ny][nx].state !== 'miss') {
            if (!adjacents.some((a) => a.x === nx && a.y === ny)) {
              adjacents.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    if (adjacents.length > 0) {
      return adjacents[Math.floor(Math.random() * adjacents.length)];
    }
  }

  // 2. Hunt Mode
  if (difficulty === 'novice') {
    // Pure random among unattacked
    return unattackedCells[Math.floor(Math.random() * unattackedCells.length)];
  }

  if (difficulty === 'veteran') {
    // Parity / Checkerboard hunting (cells where (x + y) % 2 === 0)
    const smallestRemaining = Math.min(
      ...enemyShips.filter((s) => !s.sunk).map((s) => s.size),
      2
    );

    const parityCells = unattackedCells.filter((c) => (c.x + c.y) % smallestRemaining === 0);
    if (parityCells.length > 0) {
      return parityCells[Math.floor(Math.random() * parityCells.length)];
    }
    return unattackedCells[Math.floor(Math.random() * unattackedCells.length)];
  }

  // 3. Admiral Difficulty: Probability Density Heatmap
  const remainingShips = enemyShips.filter((s) => !s.sunk);
  const heatmap: number[][] = Array(GRID_SIZE)
    .fill(0)
    .map(() => Array(GRID_SIZE).fill(0));

  for (const ship of remainingShips) {
    const size = ship.size;

    // Test horizontal placements
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x <= GRID_SIZE - size; x++) {
        let isValid = true;
        let hitsCount = 0;

        for (let i = 0; i < size; i++) {
          const cell = grid[y][x + i];
          if (cell.state === 'miss') {
            isValid = false;
            break;
          }
          if (cell.state === 'hit') {
            // If already belonging to a sunk ship, cannot overlap
            const cellShip = enemyShips.find((s) => s.id === cell.shipId);
            if (cellShip && cellShip.sunk) {
              isValid = false;
              break;
            }
            hitsCount++;
          }
        }

        if (isValid) {
          const bonus = hitsCount * 15 + 1;
          for (let i = 0; i < size; i++) {
            if (grid[y][x + i].state !== 'hit' && grid[y][x + i].state !== 'miss') {
              heatmap[y][x + i] += bonus;
            }
          }
        }
      }
    }

    // Test vertical placements
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y <= GRID_SIZE - size; y++) {
        let isValid = true;
        let hitsCount = 0;

        for (let i = 0; i < size; i++) {
          const cell = grid[y + i][x];
          if (cell.state === 'miss') {
            isValid = false;
            break;
          }
          if (cell.state === 'hit') {
            const cellShip = enemyShips.find((s) => s.id === cell.shipId);
            if (cellShip && cellShip.sunk) {
              isValid = false;
              break;
            }
            hitsCount++;
          }
        }

        if (isValid) {
          const bonus = hitsCount * 15 + 1;
          for (let i = 0; i < size; i++) {
            if (grid[y + i][x].state !== 'hit' && grid[y + i][x].state !== 'miss') {
              heatmap[y + i][x] += bonus;
            }
          }
        }
      }
    }
  }

  // Find cell with max heat
  let maxHeat = -1;
  let bestCandidates: { x: number; y: number }[] = [];

  for (const c of unattackedCells) {
    const heat = heatmap[c.y][c.x];
    if (heat > maxHeat) {
      maxHeat = heat;
      bestCandidates = [c];
    } else if (heat === maxHeat) {
      bestCandidates.push(c);
    }
  }

  if (bestCandidates.length > 0) {
    return bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
  }

  return unattackedCells[Math.floor(Math.random() * unattackedCells.length)];
}
