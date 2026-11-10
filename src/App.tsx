/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  GameMode,
  AIDifficulty,
  GamePhase,
  PlacedShip,
  GridCell,
  LogEntry,
  PlayerStats,
  TacticalAbility,
} from './types/game';
import {
  createEmptyGrid,
  populateGridWithShips,
  generateRandomFleet,
  processShot,
  areAllShipsSunk,
  calculateAIMove,
  coordToString,
  GRID_SIZE,
} from './logic/gameLogic';
import { soundManager } from './audio/soundManager';
import { TitleScreen } from './components/TitleScreen';
import { FleetSetup } from './components/FleetSetup';
import { NavalGrid } from './components/NavalGrid';
import { FleetStatus } from './components/FleetStatus';
import { CombatLog } from './components/CombatLog';
import { TacticalAbilities, AbilityType } from './components/TacticalAbilities';
import { GameOverModal } from './components/GameOverModal';
import { PassTurnModal } from './components/PassTurnModal';
import { CombatCanvasOverlay, CombatAnimationEvent } from './components/CombatCanvasOverlay';
import { Volume2, VolumeX, RotateCcw, Shield, Target, Radio } from 'lucide-react';

const INITIAL_ABILITIES: TacticalAbility[] = [
  {
    id: 'sonar',
    nameEs: 'Sonda Sonar',
    nameEn: 'Sonar Ping',
    descEs: 'Escanea un sector 3x3 detectando presencia enemiga',
    descEn: 'Scans 3x3 sector for enemy presence',
    cooldownTurns: 3,
    currentCooldown: 0,
    maxUses: 3,
    remainingUses: 3,
    icon: 'sonar',
  },
  {
    id: 'airstrike',
    nameEs: 'Bombardeo Aéreo',
    nameEn: 'Air Strike',
    descEs: 'Bombardea 3 cuadrículas consecutivas',
    descEn: 'Bombards 3 consecutive grid cells',
    cooldownTurns: 4,
    currentCooldown: 0,
    maxUses: 2,
    remainingUses: 2,
    icon: 'airstrike',
  },
  {
    id: 'torpedo',
    nameEs: 'Barrido Torpedo',
    nameEn: 'Torpedo Run',
    descEs: 'Lanza un torpedo a lo largo de una fila completa',
    descEn: 'Launches a torpedo along a whole row',
    cooldownTurns: 5,
    currentCooldown: 0,
    maxUses: 1,
    remainingUses: 1,
    icon: 'torpedo',
  },
];

export default function App() {
  // Game Setup & Settings
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('veteran');
  const [isMultiplayerLocal, setIsMultiplayerLocal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());

  // Setup Phase: Which player is placing ships ('p1' or 'p2')
  const [setupPlayer, setSetupPlayer] = useState<'p1' | 'p2'>('p1');

  // Player 1 Fleet & Board
  const [p1Ships, setP1Ships] = useState<PlacedShip[]>([]);
  const [p1Grid, setP1Grid] = useState<GridCell[][]>(createEmptyGrid());

  // Player 2 / AI Fleet & Board
  const [p2Ships, setP2Ships] = useState<PlacedShip[]>([]);
  const [p2Grid, setP2Grid] = useState<GridCell[][]>(createEmptyGrid());

  // Combat Turn State
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [activePlayer, setActivePlayer] = useState<'p1' | 'p2'>('p1');
  const [remainingSalvoShots, setRemainingSalvoShots] = useState<number>(1);
  const [aiIsThinking, setAiIsThinking] = useState<boolean>(false);

  // Tactical abilities (for tactical gameMode)
  const [p1Abilities, setP1Abilities] = useState<TacticalAbility[]>(INITIAL_ABILITIES);
  const [selectedAbility, setSelectedAbility] = useState<AbilityType | null>(null);

  // Telemetry & Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [statsP1, setStatsP1] = useState<PlayerStats>({
    shotsFired: 0,
    hits: 0,
    misses: 0,
    shipsSunk: 0,
    accuracy: 0,
  });
  const [statsP2, setStatsP2] = useState<PlayerStats>({
    shotsFired: 0,
    hits: 0,
    misses: 0,
    shipsSunk: 0,
    accuracy: 0,
  });

  // Visual Effects & Animations
  const [animationEvents, setAnimationEvents] = useState<CombatAnimationEvent[]>([]);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMute = () => {
    const updated = soundManager.toggleMute();
    setIsMuted(updated);
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  };

  const handleAnimationFinished = (id: string) => {
    setAnimationEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Add Log Entry helper
  const addLog = useCallback(
    (
      attacker: 'player' | 'enemy' | 'player1' | 'player2',
      coord: string,
      result: 'hit' | 'miss' | 'sunk' | 'ability',
      detail: string
    ) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random()}`,
          turn: currentTurn,
          attacker,
          coord,
          result,
          detail,
          timestamp: timeStr,
        },
      ]);
    },
    [currentTurn]
  );

  // START GAME: Transition from TITLE to SETUP
  const handleStartGame = () => {
    setP1Ships([]);
    setP1Grid(createEmptyGrid());
    setP2Ships([]);
    setP2Grid(createEmptyGrid());
    setLogs([]);
    setCurrentTurn(1);
    setActivePlayer('p1');
    setStatsP1({ shotsFired: 0, hits: 0, misses: 0, shipsSunk: 0, accuracy: 0 });
    setStatsP2({ shotsFired: 0, hits: 0, misses: 0, shipsSunk: 0, accuracy: 0 });
    setP1Abilities(INITIAL_ABILITIES.map((a) => ({ ...a })));
    setSetupPlayer('p1');
    setPhase('SETUP');
  };

  // When a player finishes deploying fleet
  const handleFleetReady = (placedShips: PlacedShip[]) => {
    if (setupPlayer === 'p1') {
      const populatedP1 = populateGridWithShips(createEmptyGrid(), placedShips);
      setP1Ships(placedShips);
      setP1Grid(populatedP1);

      if (isMultiplayerLocal) {
        // Player 2 needs to place ships
        setSetupPlayer('p2');
      } else {
        // Generate AI Fleet
        const aiFleet = generateRandomFleet();
        const populatedAI = populateGridWithShips(createEmptyGrid(), aiFleet);
        setP2Ships(aiFleet);
        setP2Grid(populatedAI);

        // Calculate initial salvo count if salvo mode
        if (gameMode === 'salvo') {
          setRemainingSalvoShots(placedShips.length);
        } else {
          setRemainingSalvoShots(1);
        }

        setPhase('PLAYING');
        addLog('player', 'HQ', 'ability', 'Flota aliada desplegada y armada para el combate naval.');
      }
    } else {
      // Player 2 finished placement
      const populatedP2 = populateGridWithShips(createEmptyGrid(), placedShips);
      setP2Ships(placedShips);
      setP2Grid(populatedP2);

      if (gameMode === 'salvo') {
        setRemainingSalvoShots(p1Ships.length);
      } else {
        setRemainingSalvoShots(1);
      }

      setPhase('PLAYING');
      addLog('player1', 'HQ', 'ability', 'Ambas flotas desplegadas. Comienza la batalla.');
    }
  };

  // AI TURN EXECUTION
  const executeAITurn = useCallback(() => {
    setAiIsThinking(true);

    const shotsToTake = gameMode === 'salvo' ? p2Ships.filter((s) => !s.sunk).length : 1;
    let shotIndex = 0;

    const fireAIShot = () => {
      // Calculate move
      const targetMove = calculateAIMove(p1Grid, p1Ships, difficulty);
      const coordLabel = coordToString(targetMove.x, targetMove.y);

      // Trigger missile launch
      soundManager.playMissileLaunch();

      // Launch animation from top enemy to player grid
      const animId = `ai_shot_${Date.now()}_${Math.random()}`;
      const containerRect = containerRef.current?.getBoundingClientRect();
      const startX = containerRect ? containerRect.width / 2 : 400;
      const startY = 80;
      // Approximation for target cell
      const targetX = containerRect ? containerRect.width * 0.35 + (targetMove.x - 5) * 28 : 280;
      const targetY = containerRect ? containerRect.height * 0.55 + (targetMove.y - 5) * 28 : 360;

      setAnimationEvents((prev) => [
        ...prev,
        {
          id: animId,
          type: 'miss', // updated on impact
          startX,
          startY,
          targetX,
          targetY,
          progress: 0,
          phase: 'flight',
        },
      ]);

      setTimeout(() => {
        const { newGrid, newShips, result } = processShot(targetMove.x, targetMove.y, p1Grid, p1Ships);
        setP1Grid(newGrid);
        setP1Ships(newShips);

        // Update stats
        setStatsP2((prev) => {
          const fired = prev.shotsFired + 1;
          const hits = prev.hits + (result.hit ? 1 : 0);
          const misses = prev.misses + (result.hit ? 0 : 1);
          const sunk = prev.shipsSunk + (result.sunkShip ? 1 : 0);
          const acc = fired > 0 ? Math.round((hits / fired) * 100) : 0;
          return { shotsFired: fired, hits, misses, shipsSunk: sunk, accuracy: acc };
        });

        if (result.hit) {
          triggerScreenShake();
          if (result.sunkShip) {
            soundManager.playShipSunk();
            addLog('enemy', coordLabel, 'sunk', `¡HUNDIDO! Nuestro ${result.sunkShip.nameEs || 'navío'} fue destruido.`);
          } else {
            soundManager.playExplosion();
            addLog('enemy', coordLabel, 'hit', '¡TOCADO! Impacto hostil en nuestra flota.');
          }
        } else {
          soundManager.playSplash();
          addLog('enemy', coordLabel, 'miss', 'AGUA. El proyectil hostil cayó en mar abierto.');
        }

        // Check if player lost
        if (areAllShipsSunk(newShips)) {
          soundManager.playDefeat();
          setPhase('DEFEAT');
          setAiIsThinking(false);
          return;
        }

        shotIndex++;
        if (shotIndex < shotsToTake) {
          // Take next salvo shot
          setTimeout(fireAIShot, 650);
        } else {
          // AI turn finished, return to player
          setAiIsThinking(false);
          setActivePlayer('p1');
          setCurrentTurn((t) => t + 1);

          // Reset player salvo shots
          if (gameMode === 'salvo') {
            setRemainingSalvoShots(p1Ships.filter((s) => !s.sunk).length);
          } else {
            setRemainingSalvoShots(1);
          }

          // Decrement abilities cooldown
          setP1Abilities((prev) =>
            prev.map((a) => ({
              ...a,
              currentCooldown: Math.max(0, a.currentCooldown - 1),
            }))
          );
        }
      }, 400);
    };

    setTimeout(fireAIShot, 700);
  }, [p1Grid, p1Ships, p2Ships, difficulty, gameMode, addLog]);

  // Handle Player clicking on target grid (Enemy waters)
  const handlePlayerShot = (x: number, y: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (phase !== 'PLAYING') return;
    if (aiIsThinking) return;

    const targetGrid = activePlayer === 'p1' ? p2Grid : p1Grid;
    const targetShips = activePlayer === 'p1' ? p2Ships : p1Ships;

    // Check if cell was already attacked
    if (targetGrid[y][x].state === 'hit' || targetGrid[y][x].state === 'miss') {
      return;
    }

    // Coordinates for missile animation origin
    const btnRect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    const targetScreenX = btnRect.left - (containerRect?.left || 0) + btnRect.width / 2;
    const targetScreenY = btnRect.top - (containerRect?.top || 0) + btnRect.height / 2;

    const startScreenX = targetScreenX + (Math.random() - 0.5) * 80;
    const startScreenY = (containerRect?.height || 600) - 20;

    // Tactical Ability execution
    if (selectedAbility === 'sonar') {
      soundManager.playSonarPing();
      const animId = `sonar_${Date.now()}`;
      setAnimationEvents((prev) => [
        ...prev,
        {
          id: animId,
          type: 'sonar',
          startX: targetScreenX,
          startY: targetScreenY,
          targetX: targetScreenX,
          targetY: targetScreenY,
          progress: 0.99,
          phase: 'impact',
        },
      ]);

      // Scan 3x3 sector
      let detectedCount = 0;
      const scannedGrid = targetGrid.map((row) => row.map((cell) => ({ ...cell })));
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            scannedGrid[ny][nx].revealedBySonar = true;
            if (scannedGrid[ny][nx].state === 'ship') {
              detectedCount++;
            }
          }
        }
      }

      if (activePlayer === 'p1') setP2Grid(scannedGrid);
      else setP1Grid(scannedGrid);

      // Decrement ability uses & set cooldown
      setP1Abilities((prev) =>
        prev.map((a) =>
          a.id === 'sonar'
            ? { ...a, remainingUses: a.remainingUses - 1, currentCooldown: a.cooldownTurns }
            : a
        )
      );

      const coordLabel = coordToString(x, y);
      addLog(
        activePlayer === 'p1' ? 'player' : 'player2',
        coordLabel,
        'ability',
        detectedCount > 0
          ? `SONDA SONAR: ¡Alerta! Detectadas señales de ${detectedCount} secciones navales en el cuadrante.`
          : 'SONDA SONAR: Cuadrante despejado. Sin actividad enemiga detectada.'
      );

      setSelectedAbility(null);
      return;
    }

    // Launch Missile Sound
    soundManager.playMissileLaunch();

    // Trigger Missile Animation
    const animId = `shot_${Date.now()}_${Math.random()}`;
    setAnimationEvents((prev) => [
      ...prev,
      {
        id: animId,
        type: 'hit', // Will evaluate in timeout
        startX: startScreenX,
        startY: startScreenY,
        targetX: targetScreenX,
        targetY: targetScreenY,
        progress: 0,
        phase: 'flight',
      },
    ]);

    // Handle Impact on board
    setTimeout(() => {
      const { newGrid, newShips, result } = processShot(x, y, targetGrid, targetShips);

      if (activePlayer === 'p1') {
        setP2Grid(newGrid);
        setP2Ships(newShips);
        setStatsP1((prev) => {
          const fired = prev.shotsFired + 1;
          const hits = prev.hits + (result.hit ? 1 : 0);
          const misses = prev.misses + (result.hit ? 0 : 1);
          const sunk = prev.shipsSunk + (result.sunkShip ? 1 : 0);
          const acc = fired > 0 ? Math.round((hits / fired) * 100) : 0;
          return { shotsFired: fired, hits, misses, shipsSunk: sunk, accuracy: acc };
        });
      } else {
        setP1Grid(newGrid);
        setP1Ships(newShips);
        setStatsP2((prev) => {
          const fired = prev.shotsFired + 1;
          const hits = prev.hits + (result.hit ? 1 : 0);
          const misses = prev.misses + (result.hit ? 0 : 1);
          const sunk = prev.shipsSunk + (result.sunkShip ? 1 : 0);
          const acc = fired > 0 ? Math.round((hits / fired) * 100) : 0;
          return { shotsFired: fired, hits, misses, shipsSunk: sunk, accuracy: acc };
        });
      }

      const coordLabel = coordToString(x, y);

      if (result.hit) {
        triggerScreenShake();
        if (result.sunkShip) {
          soundManager.playShipSunk();
          addLog(
            activePlayer === 'p1' ? 'player' : 'player2',
            coordLabel,
            'sunk',
            `¡HUNDIDO! El ${result.sunkShip.nameEs || 'navío'} hostil fue destruido y se hunde en el abismo.`
          );
        } else {
          soundManager.playExplosion();
          addLog(
            activePlayer === 'p1' ? 'player' : 'player2',
            coordLabel,
            'hit',
            '¡TOCADO! Impacto directo sobre un buque de guerra hostil.'
          );
        }
      } else {
        soundManager.playSplash();
        addLog(
          activePlayer === 'p1' ? 'player' : 'player2',
          coordLabel,
          'miss',
          'AGUA. Disparo fallido en mar abierto.'
        );
      }

      // Check Victory
      if (areAllShipsSunk(newShips)) {
        soundManager.playVictory();
        setPhase('VICTORY');
        return;
      }

      // Decrement Salvo shots
      const nextRemaining = remainingSalvoShots - 1;
      setRemainingSalvoShots(nextRemaining);

      if (nextRemaining <= 0) {
        // Turn ends
        if (isMultiplayerLocal) {
          // Switch to Player 2 or back to Player 1 via Pass Screen
          const nextPlayer = activePlayer === 'p1' ? 'p2' : 'p1';
          setActivePlayer(nextPlayer);
          const nextShips = nextPlayer === 'p1' ? p1Ships : p2Ships;
          setRemainingSalvoShots(gameMode === 'salvo' ? nextShips.filter((s) => !s.sunk).length : 1);
          setPhase('PASS_TURN');
        } else {
          // Switch to AI
          setActivePlayer('p2');
          executeAITurn();
        }
      }
    }, 380);
  };

  // Play Again: Re-enter setup
  const handlePlayAgain = () => {
    handleStartGame();
  };

  // Calculate live hits on friendly & enemy
  const p1TotalHitsReceived = p1Ships.reduce((acc, s) => acc + s.hits, 0);
  const p2TotalHitsReceived = p2Ships.reduce((acc, s) => acc + s.hits, 0);

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden ${
        screenShake ? 'animate-bounce' : ''
      }`}
    >
      {/* 1. TITLE SCREEN */}
      {phase === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          gameMode={gameMode}
          setGameMode={setGameMode}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          isMultiplayerLocal={isMultiplayerLocal}
          setIsMultiplayerLocal={setIsMultiplayerLocal}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 2. FLEET SETUP PHASE */}
      {phase === 'SETUP' && (
        <FleetSetup
          playerName={setupPlayer === 'p1' ? 'COMANDANTE 1' : 'COMANDANTE 2'}
          onFleetReady={handleFleetReady}
          onBackToTitle={() => setPhase('TITLE')}
        />
      )}

      {/* 3. PASS-TURN MODAL (Local 2-Player) */}
      {phase === 'PASS_TURN' && (
        <PassTurnModal
          nextPlayerName={activePlayer === 'p1' ? 'COMANDANTE 1' : 'COMANDANTE 2'}
          onProceed={() => setPhase('PLAYING')}
        />
      )}

      {/* 4. ACTIVE COMBAT VIEW */}
      {(phase === 'PLAYING' || phase === 'VICTORY' || phase === 'DEFEAT') && (
        <div className="relative w-full min-h-screen flex flex-col justify-between p-3 md:p-5 scanlines">
          {/* Canvas Overlay for Missiles, Explosions & Splashes */}
          <CombatCanvasOverlay
            activeEvents={animationEvents}
            onEventFinished={handleAnimationFinished}
            triggerScreenShake={triggerScreenShake}
          />

          {/* Top Status & HUD Bar */}
          <header className="relative z-20 flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 max-w-7xl mx-auto w-full">
            {/* Left: Brand & Turn info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-xs md:text-sm tracking-wider text-slate-100 uppercase">
                  CENTRO DE MANDO NAVAL
                </div>
                <div className="text-[11px] font-mono-combat text-slate-400">
                  MODO: {gameMode === 'classic' ? 'CLÁSICO' : gameMode === 'salvo' ? 'SALVA DE FUEGO' : 'TÁCTICO RECON'} · RANGO: {difficulty.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Center: Turn & Active Attacker Banner */}
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono-combat border ${
                  activePlayer === 'p1'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-rose-500/20 border-rose-400 text-rose-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span className="font-bold">
                  {activePlayer === 'p1'
                    ? isMultiplayerLocal
                      ? 'TURNO DE: COMANDANTE 1'
                      : 'TU TURNO (FUEGO ALIADO)'
                    : isMultiplayerLocal
                    ? 'TURNO DE: COMANDANTE 2'
                    : 'TURNO DE LA IA ENEMIGA'}
                </span>
                {gameMode === 'salvo' && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 text-[10px]">
                    DISPAROS: {remainingSalvoShots}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Sound & Resign Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                title={isMuted ? 'Activar Sonido' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                type="button"
                onClick={() => setPhase('TITLE')}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-combat text-slate-300 hover:text-rose-400 hover:border-rose-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rendirse / Menú</span>
              </button>
            </div>
          </header>

          {/* AI Calculating status ticker */}
          {aiIsThinking && (
            <div className="relative z-20 max-w-xl mx-auto w-full mb-2 px-4 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-center font-mono-combat text-xs text-rose-300 flex items-center justify-center gap-2 animate-pulse">
              <Target className="w-3.5 h-3.5 animate-spin" />
              <span>Sistemas balísticos hostiles calculando vector de tiro...</span>
            </div>
          )}

          {/* Main Dual Tactical Battle Grid Display */}
          <main className="relative z-10 flex-1 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 max-w-7xl mx-auto w-full my-auto">
            {/* Friendly Waters Grid & Fleet Status */}
            <div className="flex flex-col items-center gap-3">
              <NavalGrid
                title={isMultiplayerLocal && activePlayer === 'p2' ? 'Aguas Territoriales (Comandante 2)' : 'Aguas Territoriales Aliadas (Tus Navíos)'}
                grid={activePlayer === 'p1' ? p1Grid : p2Grid}
                ships={activePlayer === 'p1' ? p1Ships : p2Ships}
                isInteractive={false}
                showShips={true}
                radarType="friendly"
              />

              <div className="w-full max-w-[370px]">
                <FleetStatus
                  title={isMultiplayerLocal && activePlayer === 'p2' ? 'Flota Comandante 2' : 'Flota Aliada'}
                  ships={activePlayer === 'p1' ? p1Ships : p2Ships}
                  isEnemy={false}
                  totalHits={activePlayer === 'p1' ? p1TotalHitsReceived : p2TotalHitsReceived}
                />
              </div>
            </div>

            {/* Center: Tactical Support (if tactical mode) & Combat Telemetry Log */}
            <div className="w-full max-w-md flex flex-col gap-3 order-last xl:order-none">
              {gameMode === 'tactical' && (
                <TacticalAbilities
                  abilities={p1Abilities}
                  selectedAbility={selectedAbility}
                  onSelectAbility={setSelectedAbility}
                  isPlayerTurn={activePlayer === 'p1' && !aiIsThinking}
                />
              )}

              <div className="flex-1 min-h-[220px]">
                <CombatLog logs={logs} currentTurn={currentTurn} />
              </div>

              {/* Instructions / Key Hints */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono-combat text-slate-400 text-center">
                Haz clic en la cuadrícula de Aguas Hostiles para fijar el objetivo y disparar.
              </div>
            </div>

            {/* Enemy Waters Grid & Fleet Status */}
            <div className="flex flex-col items-center gap-3">
              <NavalGrid
                title={isMultiplayerLocal && activePlayer === 'p2' ? 'Radar de Ataque (Comandante 1)' : 'Radar de Ataque (Aguas Hostiles)'}
                grid={activePlayer === 'p1' ? p2Grid : p1Grid}
                ships={activePlayer === 'p1' ? p2Ships : p1Ships}
                isInteractive={!aiIsThinking && (activePlayer === 'p1' || isMultiplayerLocal)}
                showShips={false} // Hidden under fog of war
                onCellClick={handlePlayerShot}
                radarType="enemy"
              />

              <div className="w-full max-w-[370px]">
                <FleetStatus
                  title={isMultiplayerLocal && activePlayer === 'p2' ? 'Flota Comandante 1' : 'Flota Hostil'}
                  ships={activePlayer === 'p1' ? p2Ships : p1Ships}
                  isEnemy={true}
                  totalHits={activePlayer === 'p1' ? p2TotalHitsReceived : p1TotalHitsReceived}
                />
              </div>
            </div>
          </main>

          {/* Bottom Footer Telemetry */}
          <footer className="relative z-10 pt-3 border-t border-slate-800/60 text-center font-mono-combat text-[11px] text-slate-400">
            Sector Operativo: Golfo de Combate · Coordenadas A-1 a J-10 · Precisión Aliada: {statsP1.accuracy}%
          </footer>
        </div>
      )}

      {/* 5. VICTORY / DEFEAT MODAL */}
      {(phase === 'VICTORY' || phase === 'DEFEAT') && (
        <GameOverModal
          isVictory={phase === 'VICTORY'}
          winnerName={
            isMultiplayerLocal
              ? activePlayer === 'p1'
                ? 'Comandante 1'
                : 'Comandante 2'
              : 'El Comandante Aliado'
          }
          stats={activePlayer === 'p1' ? statsP1 : statsP2}
          enemyStats={activePlayer === 'p1' ? statsP2 : statsP1}
          turnCount={currentTurn}
          onPlayAgain={handlePlayAgain}
          onReturnToTitle={() => setPhase('TITLE')}
        />
      )}
    </div>
  );
}
