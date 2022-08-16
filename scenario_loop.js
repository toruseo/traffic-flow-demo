print("START");

var CANVAS = document.getElementById("main")
var CTX = CANVAS.getContext("2d")

var T = 0
var DELTAT = 10
var DELTAT_DRAW = 2
var DELTAT_EDIE = 50

var LINKS = []
LINKS.push(new Link(100, 1, 100, 50, 600, 1))

var FDCHANGERS = []

var VMAX = 4
var ACC = 999
var DECEL_PROB = 0
var VEHS = []
var VEH_IDX = 0
for(let i=0; i<10; i++){
    VEHS.push(new Vehicle(i*1, 0, LINKS[0]))
}

var SPAWNERS = []

var REGULATORS = []
REGULATORS.push(new Regulator(LINKS[0], VEHS.length, LINKS[0].xmax))

var QKPLOTS = []
QKPLOTS.push(new QKplot(300, 270, 100, 100, LINKS[0], 40, 1, 0))

var TSPLOTS = []
TSPLOTS.push(new TSplot(LINKS[0]))

var CUMPLOTS = []
CUMPLOTS.push(new Cumplot(LINKS[0], [49], ["middle of the link"], ["#006600"], [0]))

let count = 0
let prevTime = 0
requestAnimationFrame(MAINLOOP);

print("END")