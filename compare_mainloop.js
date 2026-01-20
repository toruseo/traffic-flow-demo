print("compare_mainloop.js START");

var isPaused = false
var count = 0
var prevTime = 0

window.onload = function() {
    // Initialize all three simulations
    initSingleLane()
    initMultiLane()
    initMacro()

    // Toggle pause when the pause button is clicked
    document.getElementById('pauseButton').addEventListener('click', function() {
        isPaused = !isPaused
        this.textContent = isPaused ? 'Resume' : 'Pause / Resume'
    })

    // Start the main loop
    requestAnimationFrame(MAINLOOP)
}

function MAINLOOP(time) {
    if (!isPaused) {
        const elapsedTime = time - prevTime
        if (elapsedTime >= 1000) {
            count = 0
            prevTime = time
        }
        count++

        // Update and draw single-lane simulation (Meso: Newell, uniform speed)
        globalThis.V_DESIRE_MIN = 4
        globalThis.V_DESIRE_MAX = 4
        loadContext(simSingle)
        if (T % DELTAT == 0) {
            updateSim(simSingle)
        }
        if (T % DELTAT_DRAW == 0) {
            drawSim(simSingle)
        }
        T++
        saveContext(simSingle)

        // Update and draw multi-lane simulation (Micro: NaSch, heterogeneous speeds)
        globalThis.V_DESIRE_MIN = 3
        globalThis.V_DESIRE_MAX = 5
        loadContext(simMulti)
        if (T % DELTAT == 0) {
            updateSim(simMulti)
        }
        if (T % DELTAT_DRAW == 0) {
            drawSim(simMulti)
        }
        T++
        saveContext(simMulti)

        // Update and draw macro simulation (CTM)
        loadContext(simMacro)
        if (T % DELTAT == 0) {
            updateMacro(simMacro)
        }
        if (T % DELTAT_DRAW == 0) {
            drawMacro(simMacro)
        }
        T++
        saveContext(simMacro)
    }
    requestAnimationFrame(MAINLOOP)
}

function updateSim(sim) {
    // Update links
    for (let link of LINKS) {
        link.update()
    }

    // Update FD changers based on bottleneck radio buttons
    var bnNone = document.getElementById("bn_none")
    if (bnNone != null) {
        var delta = 1
        if (document.getElementsByName("bn_impact").item(0).checked) {
            delta = 1  // None
        } else if (document.getElementsByName("bn_impact").item(1).checked) {
            delta = 2  // Light
        } else if (document.getElementsByName("bn_impact").item(2).checked) {
            delta = 4  // Heavy
        }
        for (let fdc of FDCHANGERS) {
            fdc.delta = delta
            fdc.update()
        }
    }

    // Update vehicle speeds
    for (let veh of VEHS) {
        veh.speed_change()
    }

    // Move vehicles
    for (let veh of VEHS) {
        veh.update()
    }

    // Update spawners with shared inflow value (apply coefficient for multi-lane)
    var inflowValue = Number(document.getElementById("inflow").value) / 100
    document.getElementById("inflow_value").innerHTML = inflowValue.toFixed(2)
    var inflowCoef = sim.INFLOW_COEF || 1
    for (let s of SPAWNERS) {
        s.flow = inflowValue * inflowCoef
        s.update()
    }

    // Update regulators (not used in bottleneck scenario, but keep for compatibility)
    for (let r of REGULATORS) {
        r.update()
    }

    // Remove deleted vehicles
    var VEHS_new = []
    for (let veh of VEHS) {
        if (veh.flag_delete != 1) {
            VEHS_new.push(veh)
        }
    }
    VEHS = VEHS_new
    sim.VEHS = VEHS
}

function drawSim(sim) {
    // Clear canvas
    CTX.fillStyle = "#eeeeee"
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height)

    // Draw links
    for (let link of LINKS) {
        link.draw()
    }

    // Draw vehicles
    for (let veh of VEHS) {
        veh.draw()
    }

    // Draw inflow label
    for (let s of SPAWNERS) {
        s.draw()
    }
}

// Update macro (CTM) simulation
function updateMacro(sim) {
    // Update spawners with inflow value from slider
    var inflowValue = Number(document.getElementById("inflow").value) / 100
    for (let s of SPAWNERS) {
        s.flow = inflowValue
        s.update()
    }

    // Update FD changers based on bottleneck radio buttons
    var bnNone = document.getElementById("bn_none")
    if (bnNone != null) {
        var delta = 1
        if (document.getElementsByName("bn_impact").item(0).checked) {
            delta = 1  // None
        } else if (document.getElementsByName("bn_impact").item(1).checked) {
            delta = 2  // Light
        } else if (document.getElementsByName("bn_impact").item(2).checked) {
            delta = 4  // Heavy
        }
        for (let fdc of FDCHANGERS) {
            fdc.delta = delta
            fdc.update()
        }
    }

    // Update links (CTM calculation)
    for (let link of LINKS) {
        link.update()
    }
}

// Draw macro (CTM) simulation
function drawMacro(sim) {
    // Clear canvas
    CTX.fillStyle = "#eeeeee"
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height)

    // Draw links
    for (let link of LINKS) {
        link.draw()
    }

    // Draw inflow label
    for (let s of SPAWNERS) {
        s.draw()
    }
}

print("compare_mainloop.js END");
