# traffic-flow-demo

Interactive demonstration of fundamentals of traffic flow and simulation on the web

## How to use

Access the online versions below, or download this repo and open `single_bottleneck_min.html` or other html files using a common web browser (e.g., Firefox, Chrome, Edge, Safari)

## Online versions with explanations

- [English version](http://seo.cv.ens.titech.ac.jp/traffic-flow-demo/bottleneck.html)
- [Japanese version](http://seo.cv.ens.titech.ac.jp/traffic-flow-demo/bottleneck_jp.html)

## Files

- single-lane model (Newell / Nagel-Schreckenberg)
	- `single_bottleneck_min.html`: simulator for a bottleneck
	- `single_loop_min.html`: simulator for a ring road
	- `single_mainloop.js`: code for execution and animation
	- `single_model.js`: core microscopic traffic-flow logic (car-following, plots)
	- `single_scenario_bottleneck.js`: code defining the bottleneck scenario
	- `single_scenario_loop.js`: code defining the ring road scenario
	- `util.js`: general utility

- multi-lane model (Nagel-Schreckenberg with lane-changing)
	- `lane_bottleneck_min.html`: simulator for a bottleneck
	- `lane_mainloop.js`: code for execution and animation
	- `lane_model.js`: core microscopic traffic-flow logic (car-following, multi-lane, lane-changing, plots)
	- `lane_scenario_bottleneck.js`: code defining the bottleneck scenario
	- `util.js`: general utility (shared)

- macro model (Cell Transmission Model)
	- `macro_bottleneck.html`: simulator for a bottleneck using CTM
	- `macro_mainloop.js`: code for execution and animation
	- `macro_model.js`: core macroscopic traffic-flow logic (density-based CTM)
	- `macro_scenario_bottleneck.js`: code defining the bottleneck scenario
	- `macro.md`: detailed implementation notes

- model comparison
	- `compare_bottleneck.html`: side-by-side comparison of Meso (Newell), Micro (NaSch), and Macro (CTM) models
	- `compare_mainloop.js`: code for running three simulations in parallel
	- `compare_scenario.js`: code initializing all three model types

## Traffic Flow Models

| Model | Type | Description |
|-------|------|-------------|
| Newell | Meso | Deterministic car-following, instantaneous acceleration |
| Nagel-Schreckenberg (NaSch) | Micro | Stochastic cellular automaton with gradual acceleration |
| Cell Transmission Model (CTM) | Macro | Density-based Godunov scheme, triangular FD |

## Updates

- 2026-01-20: Added CTM macro model and 3-model comparison (Meso/Micro/Macro)
- 2026-01-20: Added two-lane bottleneck scenario with lane-changing behavior and per-vehicle desired speeds
- 2023-08-10: Increased the width of time-space diagram and cumulative plot
- 2023-07-14: Implemented pause function
- 2022-08-16: Initial release
