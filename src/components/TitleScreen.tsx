import React, { useEffect } from 'react';
import { GameMode, AIDifficulty } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Play, Users, Bot, Volume2, VolumeX, Shield, Radio, Flame, Crosshair } from 'lucide-react';

interface Props {
  onStartGame: () => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: AIDifficulty;
  setDifficulty: (diff: AIDifficulty) => void;
  isMultiplayerLocal: boolean;
  setIsMultiplayerLocal: (val: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<Props> = ({
  onStartGame,
  gameMode,
  setGameMode,
  difficulty,
  setDifficulty,
  isMultiplayerLocal,
  setIsMultiplayerLocal,
  isMuted,
  onToggleMute,
}) => {
  // Listen for Enter or Space to quickly start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundManager.playTacticalClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 scanlines">
      {/* Background Hero Image with Dark Gradient Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/game_naval_battleship_1794097530614.jpg"
          alt="Acorazado en combate naval"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 scale-105 transform animate-pulse duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/50" />
      </div>

      {/* Top Bar with sound and status */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 naval-glow-cyan">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-widest text-cyan-400 uppercase">
              FLEET COMMAND
            </span>
            <div className="text-[10px] font-mono-combat text-slate-400">
              SISTEMA DE CONTROL NAVAL
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onToggleMute();
            soundManager.playTacticalClick();
          }}
          className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition-colors flex items-center gap-2 cursor-pointer"
          title={isMuted ? 'Activar Sonido' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span className="text-xs font-mono-combat hidden sm:inline">
            {isMuted ? 'SONIDO: OFF' : 'SONIDO: ON'}
          </span>
        </button>
      </header>

      {/* Centerpiece Hero Title */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-8 text-center max-w-4xl mx-auto w-full">
        {/* Bespoke SVG Title Lockup */}
        <div className="mb-4">
          <svg className="w-full max-w-[540px] h-auto drop-shadow-[0_10px_20px_rgba(6,182,212,0.3)]" viewBox="0 0 600 120" fill="none">
            {/* Compass rose / naval crosshairs decoration */}
            <circle cx="300" cy="60" r="50" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            <line x1="230" y1="60" x2="370" y2="60" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />
            <line x1="300" y1="10" x2="300" y2="110" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />

            {/* Stylized Text */}
            <text
              x="50%"
              y="55"
              textAnchor="middle"
              className="font-display font-black tracking-[0.25em]"
              fill="#ffffff"
              fontSize="44"
              fontWeight="900"
            >
              BATALLA NAVAL
            </text>
            <text
              x="50%"
              y="90"
              textAnchor="middle"
              className="font-display tracking-[0.45em]"
              fill="#38bdf8"
              fontSize="16"
              fontWeight="600"
            >
              WARFARE TACTICAL GRID
            </text>
          </svg>
        </div>

        <p className="max-w-xl text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-normal">
          Despliega tu flota de combate en aguas territoriales, calcula las coordenadas enemigas y neutraliza los acorazados rivales antes de que descubran tus navíos.
        </p>

        {/* Configuration Matrix (Mode & Opponent) */}
        <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 md:p-6 mb-6 backdrop-blur-md space-y-5">
          {/* Oponente Selector */}
          <div>
            <div className="text-xs font-mono-combat text-slate-400 mb-2 uppercase tracking-wider text-left">
              1. Selecciona Oponente
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsMultiplayerLocal(false);
                  soundManager.playTacticalClick();
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                  !isMultiplayerLocal
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Vs. Inteligencia Artificial</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMultiplayerLocal(true);
                  soundManager.playTacticalClick();
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                  isMultiplayerLocal
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>2 Jugadores (Pasa y Juega)</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty (Only if vs AI) */}
          {!isMultiplayerLocal && (
            <div>
              <div className="text-xs font-mono-combat text-slate-400 mb-2 uppercase tracking-wider text-left">
                2. Nivel Táctico de la Flota Enemiga
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'novice', label: 'Novato', desc: 'Disparos aleatorios' },
                  { id: 'veteran', label: 'Veterano', desc: 'Rastreo y cuadrícula' },
                  { id: 'admiral', label: 'Almirante', desc: 'Mapa de calor militar' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      setDifficulty(diff.id as AIDifficulty);
                      soundManager.playTacticalClick();
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      difficulty === diff.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">{diff.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono-combat mt-0.5">{diff.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Game Mode */}
          <div>
            <div className="text-xs font-mono-combat text-slate-400 mb-2 uppercase tracking-wider text-left">
              {isMultiplayerLocal ? '2. Reglas del Combate' : '3. Reglas del Combate'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'classic', label: 'Clásico', icon: <Crosshair className="w-3.5 h-3.5" />, desc: '1 tiro / turno' },
                { id: 'salvo', label: 'Modo Salva', icon: <Flame className="w-3.5 h-3.5" />, desc: 'Tiros = barcos vivos' },
                { id: 'tactical', label: 'Táctico', icon: <Radio className="w-3.5 h-3.5" />, desc: 'Sonar y bombardeo' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setGameMode(m.id as GameMode);
                    soundManager.playTacticalClick();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    gameMode === m.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 font-semibold text-xs text-slate-200">
                    <span className="text-cyan-400">{m.icon}</span>
                    <span>{m.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-combat">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <button
          type="button"
          onClick={() => {
            soundManager.playSonarPing();
            onStartGame();
          }}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-display font-bold text-base tracking-wider uppercase hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-xl shadow-cyan-500/25 active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Iniciar Despliegue de Flota</span>
        </button>
      </main>

      {/* Flat Control Hint Line */}
      <footer className="relative z-10 py-4 px-6 border-t border-slate-800/60 bg-slate-950/70 text-center font-mono-combat text-xs text-slate-400">
        Enter / Espacio Iniciar · R Rotar Navío · Clic Izquierdo Disparar
      </footer>
    </div>
  );
};
