print("START");

var CANVAS = document.getElementById("main")
var CTX = CANVAS.getContext("2d")

var T = 0
var DELTAT = 10
var DELTAT_DRAW = 2
var DELTAT_EDIE = 100

var LINKS = []
LINKS.push(new Link(100, 1, 100, 50, 600, 0))
LINKS[0].set_delta(70, 80, 2)

var FDCHANGERS = []
FDCHANGERS.push(new FDchanger(LINKS[0], 70, 80))

var VMAX = 4
var ACC = 999
var DECEL_PROB = 0
var VEHS = []
var VEH_IDX = 0

var SPAWNERS = []
SPAWNERS.push(new Spawner(LINKS[0], 0.1, 1))

var REGULATORS = []

var QKPLOTS = []
QKPLOTS.push(new QKplot(40+40, 270, 100, 100, LINKS[0], 10, 1, 0))
QKPLOTS.push(new QKplot(230+40, 270, 100, 100, LINKS[0], 40, 1, 0))
QKPLOTS.push(new QKplot(420+40, 270, 100, 100, LINKS[0], 60, 1, 0))
QKPLOTS.push(new QKplot(610+40, 270, 100, 100, LINKS[0], 90, 1, 0))

var TSPLOTS = []
TSPLOTS.push(new TSplot(LINKS[0]))

var CUMPLOTS = []
//CUMPLOTS.push(new Cumplot(LINKS[0], [75, 5, 5], ["bottleneck", "upstream end", "upstream end (shifted)"], ["#ff0000", "#0000ff", "#aaaaff"], [0, 0, 70/VMAX]))
CUMPLOTS.push(new Cumplot(LINKS[0], [5, 5, 75], ["upstream end", "upstream end (shifted)", "bottleneck"], ["#0000ff", "#aaaaff", "#ff0000"], [0, 70/VMAX, 0]))

let count = 0
let prevTime = 0
requestAnimationFrame(MAINLOOP);


print("END")