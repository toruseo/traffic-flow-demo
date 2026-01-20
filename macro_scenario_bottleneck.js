print("macro_scenario_bottleneck.js START")

// Canvas and context
var CANVAS = document.getElementById("main")
var CTX = CANVAS.getContext("2d")

// Global timing parameters
var T = 0
var DELTAT = 10
var DELTAT_DRAW = 2

// Macro model parameters
var MACRO_CELLS = 20      // Number of macro cells
var MACRO_CELL_SIZE = 5   // Each macro cell = 5 micro cells
// Total road length: 20 * 5 = 100 micro cells (same as micro model)

// Bottleneck position in macro cells
// Micro model: cells 70-80 (out of 100)
// Macro model: cells 14-16 (out of 20) -> 70/5=14, 80/5=16
var BN_START = 14
var BN_END = 16

// Global arrays
var LINKS = []
var SPAWNERS = []
var FDCHANGERS = []

// Create link (20 cells, delta=1, position 100,50, length 600, not a loop, cell size 5)
LINKS.push(new MacroLink(MACRO_CELLS, 1, 100, 50, 600, 0, MACRO_CELL_SIZE))

// Create FD changer for bottleneck region
FDCHANGERS.push(new MacroFDchanger(LINKS[0], BN_START, BN_END))

// Create spawner (initial flow 0.2)
SPAWNERS.push(new MacroSpawner(LINKS[0], 0.2, 1))

// Initialize inflow display
document.getElementById("inflow_value").innerHTML = "0.20"

print("macro_scenario_bottleneck.js END")
