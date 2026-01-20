# traffic-flow-demo

Interactive demonstration of fundamentals of traffic flow and simulation on the web

## How to use

Access the online versions below, or download this repo and open `bottleneck_min.html` or other html files using a common web browser (e.g., Firefox, Chrome, Edge, Safari)

## Online versions with explanations

- [English version](http://seo.cv.ens.titech.ac.jp/traffic-flow-demo/bottleneck.html)
- [Japanese version](http://seo.cv.ens.titech.ac.jp/traffic-flow-demo/bottleneck_jp.html)

## Files

- single-lane model
	- `bottleneck_min.html`: simulator for a bottleneck
	- `loop_min.html`: simulator for a ring road
	- `mainloop.js`: code for execution and animation
	- `model.js`: core microscopic traffic-flow logic (car-following, plots)
	- `scenario_bottleneck.js`: code defining the bottleneck scenario
	- `scenario_loop.js`: code defining the ring road scenario
	- `util.js`: general utility

- multi-lane model
	- `lane_bottleneck_min.html`: simulator for a bottleneck
	- `lane_mainloop.js`: code for execution and animation
	- `lane_model.js`: core microscopic traffic-flow logic (car-following, multi-lane, lane-changing, plots)
	- `lane_scenario_bottleneck.js`: code defining the bottleneck scenario
	- `lane_util.js`: general utility

## Updates

- 2026-01-20: Added two-lane bottleneck scenario with lane-changing behavior and per-vehicle desired speeds
- 2023-08-10: Increased the width of time-space diagram and cumulative plot
- 2023-07-14: Implemented pause function
- 2022-08-16: Initial release
