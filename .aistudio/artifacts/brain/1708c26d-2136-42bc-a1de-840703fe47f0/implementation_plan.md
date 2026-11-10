# Arquitectura por Pantallas: Menú de Inicio, Modo de Juego (IA & Multijugador con Salas) y Combate Naval

Estructuración modular de Batalla Naval en pantallas secuenciales dedicadas: Pantalla de Inicio con acciones Iniciar y Salir, Selección de Modo (IA con selector de dificultad o Multijugador con salas de espera y códigos de partida), Despliegue interactivo de flota y Combate táctico en pantalla completa sin scrolling vertical.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario:**
> - **Modo Multijugador**: Sistema de salas con código de partida (`#SALA-XXXX`) y lista de espera táctica interactiva con búsqueda de comandantes activos.
> - **Botón Salir**: Ventana de confirmación militar con intento de cierre de pestaña (`window.close()`) y pantalla de desconexión naval en caso de restricción de seguridad del navegador.
> - **Dificultad de la IA**: Selector dedicado con niveles Novato (disparos aleatorios), Veterano (rastreo adyacente estándar) y Almirante (persecución en línea y alta agresividad).
> - **Formato visual**: Se mantiene la disciplina de pantalla completa (100vh) sin barras de desplazamiento vertical para garantizar jugabilidad fluida.

---

### 1. Overview & Core Concept

El usuario experimentará una navegación clara y guiada mediante una máquina de estados por pantallas:
1. **Pantalla 1 - Inicio**: Presentación del título, emblema naval, botón primario **Iniciar** y botón de **Salir**.
2. **Pantalla 2 - Selección de Modo de Juego**:
   - **Combate vs Inteligencia Artificial**: Despliega el selector táctico de dificultad (Novato, Veterano, Almirante) y botón de avanzar.
   - **Modo Multijugador**: Despliega el centro de operaciones con creación de sala con código de 6 caracteres, opción de unirse con código y lista interactiva de salas y contrincantes en espera.
3. **Pantalla 3 - Despliegue de Flota**: Colocación interactiva de los 5 navíos de guerra simétricos (17 casillas), rotación con tecla `[R]`, botón de azar y validación estricta.
4. **Pantalla 4 - Combate Naval Dual (100vh)**: Dos cuadrículas 10×10 lado a lado (Tu Flota a la izquierda, Radar de Ataque a la derecha) con turnos alternados, misiles balísticos animados y efectos de sonido Web Audio API.
5. **Pantalla 5 - Fin de Partida**: Reporte de combate (Victoria o Derrota), precisión militar y opciones de revancha o volver al menú.

---

### 2. User Experience & Visual Design

#### Flujo de Navegación por Pantallas

```
┌────────────────────────┐
│  1. PANTALLA DE INICIO │
│  Título · Iniciar · Salir
└───────────┬────────────┘
            │ Clic "Iniciar"
            ▼
┌──────────────────────────────────────────────┐
│       2. PANTALLA DE MODO DE JUEGO          │
│  [🤖 vs Inteligencia Artificial]             │
│   └──> Seleccionar Dificultad                │
│        (Novato · Veterano · Almirante)       │
│                                              │
│  [🌐 Multijugador en Línea]                  │
│   └──> Salas con Código & Lista de Espera    │
│        (Crear Sala · Unirse · Lista Activa)  │
└──────────────────────┬───────────────────────┘
                       │ Modo & Rival configurado
                       ▼
┌──────────────────────────────────────────────┐
│        3. DESPLIEGUE DE FLOTA (SETUP)        │
│  Cuadrícula 10×10 · 5 Navíos · Rotación [R]  │
└──────────────────────┬───────────────────────┘
                       │ Flota completa (17 puntos)
                       ▼
┌──────────────────────────────────────────────┐
│     4. COMBATE NAVAL (100VH LADO A LADO)     │
│  [Tu Flota 10×10] ◄─────► [Radar Hostil 10×10]│
│  Turno por Turno · Sonido · Trayectoria FX   │
└──────────────────────┬───────────────────────┘
                       │ 17 impactos alcanzados
                       ▼
┌──────────────────────────────────────────────┐
│        5. MODAL DE FIN DE PARTIDA            │
│  ¡Victoria! / ¡Derrota! · Rango · Estadísticas│
└──────────────────────────────────────────────┘
```

#### Estética y Diseño Visual
- **Tema**: Azul marino profundo (`#030712`), paneles traslúcidos con efecto de cristal esmerilado (`#0f172a`), líneas de escaneo táctico (scanlines) y acentos en cian militar (`#38bdf8`) y carmesí de alerta (`#f43f5e`).
- **Tipografía**: `Chakra Petch` para encabezados de mando militar, `Plus Jakarta Sans` para textos explicativos legibles y `JetBrains Mono` con `tabular-nums` para coordenadas de tiro y métricas.
- **Micro-interacciones**: Transiciones suaves sin desfase de layout entre pantallas, sin scrollbar vertical (`h-full overflow-hidden`).

---

### 3. Key Product Decisions & Trade-Offs

- **Máquina de Estados Centralizada**: En lugar de ocultar o mostrar bloques dispersos, la clase `BattleshipGame` gestiona una variable `currentScreen: 'TITLE' | 'MODE_SELECT' | 'MULTIPLAYER_LOBBY' | 'SETUP' | 'BATTLE'`.
- **Salas Multijugador**: Implementación de sistema de salas con generación de códigos aleatorios únicos (ej. `NAVAL-842`), panel de anfitrión/invitado, lista de espera con salas disponibles listas para combate y conexión instantánea.
- **Compatibilidad Standalone**: Todo el código se mantiene 100% JavaScript Vanilla compatible con Vite y sincronizado con `standalone.html` para que el usuario pueda jugar con doble clic en Windows sin dependencias.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       STATE STORE                           │
│  currentScreen: 'TITLE' | 'MODE_SELECT' | 'LOBBY' | ...     │
│  gameConfig: { mode: 'AI'|'MULTIPLAYER', diff, roomCode }   │
│  playerFleet: ShipInstance[5] · playerGrid: Cell[10][10]    │
│  enemyFleet:  ShipInstance[5] · enemyGrid:  Cell[10][10]    │
│  turnState:   { currentTurn, activeTurn, isThinking }       │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       UI SCREEN VIEWS       │ │      SERVICES & AUDIO       │
│  #screen-title              │ │  SoundFX (Web Audio API)    │
│  #screen-mode-select        │ │  CanvasEffects (Missiles/FX)│
│  #screen-multiplayer-lobby  │ │  AIMoveEngine (Adjacency)   │
│  #screen-setup              │ │  LobbyEngine (Rooms & Codes)│
│  #screen-battle             │ └─────────────────────────────┘
└─────────────────────────────┘
```

#### Tareas Concretas a Realizar tras Aprobación:
1. **Markup HTML (`index.html` & `standalone.html`)**:
   - Agregar pantalla de inicio con botones Iniciar y Salir.
   - Agregar modal de confirmación de salida.
   - Agregar pantalla de selección de modo (vs IA con botones de dificultad: Novato, Veterano, Almirante; vs Multijugador).
   - Agregar pantalla de sala multijugador (crear sala, código de partida, unirse y lista de espera de comandantes).
2. **Lógica en TypeScript/JavaScript (`src/main.ts` & `script.js`)**:
   - Implementar el enrutador de pantallas y transiciones de estado.
   - Implementar generador y gestor de salas multijugador con código y lista de espera interactiva.
   - Conectar los tres niveles de dificultad de la IA.
   - Integrar flujo directo al despliegue y combate en 100vh.
3. **Verificación y Compilación**:
   - Co-ejecución de `compile_applet` y `lint_applet` con 0 errores.
   - Reinicio de dev server y validación de compatibilidad standalone.
