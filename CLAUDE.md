# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General notes

ユーザーには日本語で応答する．

Do not perform any Git operations. Let the user handle them.

## Project Overview

This is a browser-based interactive traffic flow simulator demonstrating microscopic traffic flow models. The project implements cellular automaton models (Newell and Nagel-Schreckenberg) for simulating vehicle behavior, bottlenecks, and traffic dynamics with real-time visualization.

## How to Run

This is a **client-side only** JavaScript application with no build process or dependencies.

To run:
1. Open any HTML file directly in a web browser (e.g., `bottleneck_min.html`, `loop_min.html`, `lane_bottleneck_min.html`)
2. No server, build step, or package installation required

## Code Architecture

The codebase is organized into three parallel implementations:

### Single-Lane Model (Micro/Meso)
- **HTML Entry**: `bottleneck_min.html`, `loop_min.html`
- **Core Files**:
  - `model.js` - Vehicle class and Link class implementing traffic flow logic
  - `mainloop.js` - Animation loop using requestAnimationFrame, update/draw scheduling
  - `scenario_bottleneck.js` / `scenario_loop.js` - Scenario initialization (links, spawners, plots)
  - `util.js` - Canvas drawing utilities (draw_rect, draw_circle, draw_line, draw_text)

### Multi-Lane Model (Micro)
- **HTML Entry**: `lane_bottleneck_min.html`
- **Core Files**:
  - `lane_model.js` - Enhanced Vehicle class with lane-changing logic and multi-lane Link class
  - `lane_mainloop.js` - Same animation structure as single-lane
  - `lane_scenario_bottleneck.js` - Multi-lane scenario setup
  - `lane_util.js` - Drawing utilities for multi-lane visualization

### Macro Model (CTM)
- **HTML Entry**: `macro_bottleneck.html`
- **Core Files**:
  - `macro_model.js` - MacroLink class implementing Cell Transmission Model (density-based)
  - `macro_mainloop.js` - Animation loop for CTM
  - `macro_scenario_bottleneck.js` - Macro scenario setup
- **Documentation**: `macro.md` - Detailed implementation notes

### Model Comparison
- **HTML Entry**: `compare_bottleneck.html`
- **Core Files**:
  - `compare_scenario.js` - Initializes all three model types (Meso/Micro/Macro)
  - `compare_mainloop.js` - Runs three simulations in parallel
- Shows Newell (Meso), NaSch (Micro), and CTM (Macro) side-by-side

### Key Classes and Responsibilities

**Vehicle class** (`model.js` / `lane_model.js`):
- Represents individual vehicles with position (`x`), velocity (`v`), and lane (multi-lane only)
- `speed_change()` - Implements car-following model (acceleration, deceleration, collision avoidance)
- `move()` - Updates position and records Edie statistics (time/distance traveled)
- `evaluateLaneChange()` - (Multi-lane) Decides target lane based on safety and speed gain
- Each vehicle has random color and unique index for trajectory tracking

**Link class** (`model.js` / `lane_model.js`):
- Represents road segments with cellular automaton grid
- `xmax` - Length in cells
- `delta` - Local fundamental diagram parameter array (affects following distance)
- `vehs` - Occupancy grid (single-lane: 1D array, multi-lane: 2D array indexed by `[lane][x]`)
- `loop` - 1 for ring road (periodic boundary), 0 for open road
- Edie statistics: `ts`/`ds` arrays accumulate time-spent/distance-traveled for flow/density/speed calculations
- Methods: `get_vehicle()`, `set_vehicle()`, `get_delta()`, `set_delta()`
- Multi-lane: Constructor takes `lanes` parameter, methods accept `(lane, x)` or `(x, lane)` arguments

**FDchanger class** (`model.js`):
- Modifies `delta` values in a range to simulate bottlenecks
- Creates capacity reductions by increasing minimum following distance
- Used in bottleneck scenarios only

**Spawner class**:
- Generates vehicles at link entrances based on inflow rate
- Controlled by HTML range input
- Used in bottleneck scenarios (open road)

**Regulator class**:
- Controls number of vehicles in ring road scenarios
- Adds/removes vehicles to maintain target count
- Used in `loop_min.html` scenario only

**Plot classes** (`QKplot`, `TSplot`, `Cumplot`):
- Real-time visualization of traffic states, trajectories, and cumulative counts
- QKplot shows flow-density relationships at specific locations
- TSplot draws time-space diagrams
- Cumplot creates cumulative count curves

**MacroLink class** (`macro_model.js`):
- Represents road segment with CTM (Cell Transmission Model) dynamics
- Uses larger cells (each macro cell = 5 micro cells) for true macroscopic behavior
- `density[]` - Continuous density array (vehicles per cell, not binary occupancy)
- `flow[]` - Cell boundary flow rates
- `capacity[]` / `kjLocal[]` - Local capacity and jam density for bottlenecks
- `update()` - Implements Godunov scheme: `n[i](t+1) = n[i](t) + y[i] - y[i+1]`
- Parameters calibrated to match micro model: `vf=0.8`, `w=0.2`, `kj=5` (per macro cell)

**MacroSpawner / MacroFDchanger** (`macro_model.js`):
- Analogous to micro model classes but for density-based simulation
- MacroSpawner sets upstream boundary flow
- MacroFDchanger reduces capacity/jam density in bottleneck region

### Animation and Update Loop

The `mainloop.js` / `lane_mainloop.js` files implement a fixed time-step simulation:

- `MAINLOOP(time)` - requestAnimationFrame callback
- `T` - Global time counter (increments every frame)
- `DELTAT` - Physics update interval (e.g., every 10 frames)
- `DELTAT_DRAW` - Rendering interval (e.g., every 2 frames)
- `DELTAT_EDIE` - Statistics calculation interval (e.g., every 100 frames)
- `isPaused` - Global pause state toggled by pause button

Update sequence:
1. `updates()` - Vehicle dynamics (speed_change, move) and link updates
2. `draws()` - Canvas rendering of vehicles, links, and plots
3. `edies()` - Calculate flow/density/speed from accumulated statistics

### Traffic Flow Models

Three model types are implemented:

1. **Newell model** (Meso - Kinematic Wave Theory):
   - `ACC = 999` (instantaneous acceleration)
   - `DECEL_PROB = 0` (deterministic)
   - Pure car-following with delta-based spacing
   - Individual vehicles, deterministic behavior

2. **Nagel-Schreckenberg model** (Micro):
   - `ACC = 1` (gradual acceleration)
   - `DECEL_PROB > 0` (stochastic randomization)
   - More realistic stop-and-go behavior
   - Individual vehicles with lane-changing

3. **CTM - Cell Transmission Model** (Macro):
   - Density-based simulation (no individual vehicles)
   - Godunov scheme with triangular fundamental diagram
   - Parameters: `vf=0.8`, `w=0.2`, `kj=5` (calibrated to match micro)
   - 20 macro cells (each = 5 micro cells)
   - Deterministic, immediate convergence to steady state

### Multi-Lane Specific Features

**Lane-changing logic** (`lane_model.js:evaluateLaneChange()`):
- Vehicles prefer left-most lane (return with 10% probability when safe)
- Change to right lane only when current lane limits progress and gain > threshold
- Safety checks: `lookAhead`/`lookBehind` cells must be clear
- Parameters defined in `lane_scenario_bottleneck.js`:
  - `LANE_CHANGE_LOOK_AHEAD` (default: 6 cells)
  - `LANE_CHANGE_LOOK_BEHIND` (default: 3 cells)
  - `LANE_CHANGE_MIN_GAIN` (default: 1 cell/timestep speed improvement)
  - `LANE_CHANGE_RETURN_TOLERANCE` (default: 1)
- `getGlobalParam()` function allows runtime override via `globalThis`

**Desired speed distribution**:
- Each vehicle gets random `vmax` between `V_DESIRE_MIN` and `V_DESIRE_MAX`
- Parameters set in `lane_scenario_bottleneck.js`: `V_DESIRE_MIN=3`, `V_DESIRE_MAX=5`
- Creates heterogeneous traffic with faster/slower vehicles motivating lane changes
- Falls back to `VMAX` if global params not set

### Scenario Structure

Scenario files (`scenario_*.js`) define:
- Global constants: `VMAX`, `ACC`, `DECEL_PROB`, `DELTAT`, `DELTAT_DRAW`, `DELTAT_EDIE`
- Global arrays: `LINKS`, `VEHS`, `SPAWNERS`, `REGULATORS`, `FDCHANGERS`, `QKPLOTS`, `TSPLOTS`, `CUMPLOTS`
- Canvas context: `CANVAS`, `CTX`
- Initialization: Create links, set bottleneck locations (`set_delta()`), position plots, initial vehicles

**Three scenarios exist**:

1. **Bottleneck (single-lane)** - `scenario_bottleneck.js`:
```javascript
LINKS.push(new Link(100, 1, 100, 50, 600, 0)) // length=100, delta=1, position/size, not-loop
LINKS[0].set_delta(70, 80, 2) // cells 70-80 have delta=2 (bottleneck)
SPAWNERS.push(new Spawner(LINKS[0], 0.1, 1)) // spawn rate controlled by slider
```

2. **Ring road (single-lane)** - `scenario_loop.js`:
```javascript
LINKS.push(new Link(100, 1, 100, 50, 600, 1)) // loop=1 (periodic boundary)
// Initial vehicles created directly in VEHS array
for(let i=0; i<10; i++){
    VEHS.push(new Vehicle(i*1, 0, LINKS[0]))
}
REGULATORS.push(new Regulator(LINKS[0], VEHS.length, LINKS[0].xmax))
```

3. **Bottleneck (multi-lane)** - `lane_scenario_bottleneck.js`:
```javascript
var NUM_LANES = 2
LINKS.push(new Link(100, 1, 100, 50, 600, 0, NUM_LANES))
// Lane-changing parameters defined as global variables
```

### HTML Structure

Each HTML file:
- Single `<canvas id="main">` element
- Script includes in order: util → model → mainloop → scenario
- UI controls: inflow slider, bottleneck impact radios, visualization checkboxes
- Pause/Resume button wired to `isPaused` flag

## Development Notes

- **No TypeScript, no modules**: Plain ES6 classes with global scope
- **State lives in scenario files**: `VEHS`, `LINKS`, etc. are global arrays
- **Canvas-based rendering**: All drawing through CTX (2D context), no external libraries
- **Cellular automaton**: Discrete space (integer cell positions) and time
- **Edie's definitions**: Used for calculating flow/density from individual vehicle movements
- When modifying physics, test both Newell and Nagel-Schreckenberg modes (radio buttons in UI)
- Multi-lane parameters can be overridden via `globalThis` (e.g., `globalThis.LANE_CHANGE_MIN_GAIN = 2`)
- `getGlobalParam(name, fallback)` in `lane_model.js` checks `globalThis` first, then uses fallback

## File Correspondence

| HTML File | Model | Mainloop | Scenario | Features |
|-----------|-------|----------|----------|----------|
| `bottleneck_min.html` | `model.js` | `mainloop.js` | `scenario_bottleneck.js` | Single-lane bottleneck with spawner |
| `loop_min.html` | `model.js` | `mainloop.js` | `scenario_loop.js` | Ring road with regulator |
| `lane_bottleneck_min.html` | `lane_model.js` | `lane_mainloop.js` | `lane_scenario_bottleneck.js` | Multi-lane bottleneck with lane-changing |
| `macro_bottleneck.html` | `macro_model.js` | `macro_mainloop.js` | `macro_scenario_bottleneck.js` | CTM macro model bottleneck |
| `compare_bottleneck.html` | `lane_model.js` + `macro_model.js` | `compare_mainloop.js` | `compare_scenario.js` | 3-model comparison (Meso/Micro/Macro) |
