print("compare_scenario.js START");

// Global timing parameters (shared)
var DELTAT = 10
var DELTAT_DRAW = 2
var DELTAT_EDIE = 100

// Declare global variables that will be swapped during context switching
var CTX = null
var CANVAS = null
var T = 0
var LINKS = []
var VEHS = []
var SPAWNERS = []
var FDCHANGERS = []
var REGULATORS = []
var QKPLOTS = []
var TSPLOTS = []
var CUMPLOTS = []
var VEH_IDX = 0
var VMAX = 4
var ACC = 999
var DECEL_PROB = 0

// Multi-lane parameters (set on globalThis for lane_model.js)
globalThis.LANE_CHANGE_LOOK_AHEAD = 6
globalThis.LANE_CHANGE_LOOK_BEHIND = 3
globalThis.LANE_CHANGE_MIN_GAIN = 1
globalThis.LANE_CHANGE_RETURN_TOLERANCE = 1
globalThis.V_DESIRE_MIN = 3
globalThis.V_DESIRE_MAX = 5

// coef_flow for QKplot (required by lane_model.js QKplot)
var coef_flow = 1

// Single-lane simulation state (Meso: Newell model)
var simSingle = {
    CANVAS: null,
    CTX: null,
    T: 0,
    LINKS: [],
    VEHS: [],
    SPAWNERS: [],
    FDCHANGERS: [],
    REGULATORS: [],
    QKPLOTS: [],
    TSPLOTS: [],
    CUMPLOTS: [],
    VEH_IDX: 0,
    VMAX: 4,
    ACC: 999,      // Newell model: instant acceleration
    DECEL_PROB: 0, // Newell model: no stochastic deceleration
    NUM_LANES: 1
};

// Multi-lane simulation state (Micro: Nagel-Schreckenberg model)
var simMulti = {
    CANVAS: null,
    CTX: null,
    T: 0,
    LINKS: [],
    VEHS: [],
    SPAWNERS: [],
    FDCHANGERS: [],
    REGULATORS: [],
    QKPLOTS: [],
    TSPLOTS: [],
    CUMPLOTS: [],
    VEH_IDX: 0,
    VMAX: 4,
    ACC: 1,          // Nagel-Schreckenberg model: gradual acceleration
    DECEL_PROB: 0.2, // Nagel-Schreckenberg model: stochastic deceleration
    NUM_LANES: 2,
    INFLOW_COEF: 1.4   // Inflow coefficient for multi-lane (adjustable)
};

// Macro simulation state (CTM model)
var simMacro = {
    CANVAS: null,
    CTX: null,
    T: 0,
    LINKS: [],
    VEHS: [],           // CTM doesn't use individual vehicles, but keep for interface compatibility
    SPAWNERS: [],
    FDCHANGERS: [],
    REGULATORS: [],
    QKPLOTS: [],
    TSPLOTS: [],
    CUMPLOTS: [],
    VEH_IDX: 0,
    VMAX: 4,
    ACC: 999,
    DECEL_PROB: 0
};

// Initialize single-lane simulation (Meso: Newell)
function initSingleLane() {
    simSingle.CANVAS = document.getElementById("canvas_single")
    simSingle.CTX = simSingle.CANVAS.getContext("2d")

    // Set global context for Link/Vehicle constructors
    loadContext(simSingle)

    // Create link with 1 lane
    var link = new Link(100, 1, 100, 50, 600, 0, 1)
    link.set_delta(70, 80, 2)
    simSingle.LINKS.push(link)

    // Create FD changer for bottleneck
    simSingle.FDCHANGERS.push(new FDchanger(link, 70, 80))

    // Create spawner
    simSingle.SPAWNERS.push(new Spawner(link, 0.2, 1))

    saveContext(simSingle)
}

// Initialize multi-lane simulation (Micro: NaSch)
function initMultiLane() {
    simMulti.CANVAS = document.getElementById("canvas_multi")
    simMulti.CTX = simMulti.CANVAS.getContext("2d")

    // Set global context for Link/Vehicle constructors
    loadContext(simMulti)

    // Create link with 2 lanes
    var link = new Link(100, 1, 100, 50, 600, 0, 2)
    link.set_delta(70, 80, 2)
    simMulti.LINKS.push(link)

    // Create FD changer for bottleneck
    simMulti.FDCHANGERS.push(new FDchanger(link, 70, 80))

    // Create spawner (fmax adjusted by INFLOW_COEF)
    simMulti.SPAWNERS.push(new Spawner(link, 0.2, simMulti.INFLOW_COEF))

    saveContext(simMulti)
}

// Macro model parameters
var MACRO_CELLS = 20      // Number of macro cells
var MACRO_CELL_SIZE = 5   // Each macro cell = 5 micro cells
// Total road length: 20 * 5 = 100 micro cells (same as micro model)
// Bottleneck position: micro 70-80 -> macro 14-16

// Initialize macro simulation (CTM)
function initMacro() {
    simMacro.CANVAS = document.getElementById("canvas_macro")
    simMacro.CTX = simMacro.CANVAS.getContext("2d")

    // Set global context
    loadContext(simMacro)

    // Create macro link (20 cells, delta=1, position 100,50, length 600, not a loop, cell size 5)
    var link = new MacroLink(MACRO_CELLS, 1, 100, 50, 600, 0, MACRO_CELL_SIZE)
    simMacro.LINKS.push(link)

    // Create FD changer for bottleneck region (cells 14-16, corresponding to micro 70-80)
    simMacro.FDCHANGERS.push(new MacroFDchanger(link, 14, 16))

    // Create spawner (initial flow 0.2)
    simMacro.SPAWNERS.push(new MacroSpawner(link, 0.2, 1))

    saveContext(simMacro)
}

// Load global variables from simulation context
function loadContext(sim) {
    CANVAS = sim.CANVAS
    CTX = sim.CTX
    T = sim.T
    LINKS = sim.LINKS
    VEHS = sim.VEHS
    SPAWNERS = sim.SPAWNERS
    FDCHANGERS = sim.FDCHANGERS
    REGULATORS = sim.REGULATORS
    QKPLOTS = sim.QKPLOTS
    TSPLOTS = sim.TSPLOTS
    CUMPLOTS = sim.CUMPLOTS
    VEH_IDX = sim.VEH_IDX
    VMAX = sim.VMAX
    ACC = sim.ACC
    DECEL_PROB = sim.DECEL_PROB
}

// Save global variables back to simulation context
function saveContext(sim) {
    sim.T = T
    sim.VEH_IDX = VEH_IDX
    // LINKS, VEHS, SPAWNERS, FDCHANGERS are references, so they update automatically
}

print("compare_scenario.js END");
