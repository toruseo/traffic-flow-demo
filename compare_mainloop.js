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
    var bnImpact = document.querySelector('input[name="bn_impact"]:checked')
    if (bnImpact != null) {
        var delta = 1
        if (bnImpact.value == "n") {
            delta = 1  // None
        } else if (bnImpact.value == "l") {
            delta = 2  // Light
        } else if (bnImpact.value == "h") {
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
        if (sim === simMulti) {
            // For multi-lane, display slider value (0~1) instead of actual flow
            var inflowValue = Number(document.getElementById("inflow").value) / 100
            draw_text("inflow = " + inflowValue.toFixed(2), s.link.px, s.link.py - 20, "#000000", 12)
        } else {
            s.draw()
        }
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
    var bnImpact = document.querySelector('input[name="bn_impact"]:checked')
    if (bnImpact != null) {
        var delta = 1
        if (bnImpact.value == "n") {
            delta = 1  // None
        } else if (bnImpact.value == "l") {
            delta = 2  // Light
        } else if (bnImpact.value == "h") {
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

    // Draw colorbar inside canvas (centered at bottom)
    if (LINKS.length > 0) {
        var link = LINKS[0]
        var barW = 200
        var barH = 10
        var barX = (CANVAS.width - barW) / 2
        var barY = CANVAS.height - 28
        var kcRatio = link.kc / link.kj * 1.01

        // Draw gradient bar
        for (let i = 0; i < barW; i++) {
            let ratio = i / barW
            if (ratio < 0.01) {
                CTX.fillStyle = "#ffffff"
            } else if (ratio < kcRatio) {
                let r = (ratio - 0.01) / (kcRatio - 0.01)
                let hue = 120
                let saturation = 20 + r * 60
                let lightness = 90 - r * 40
                CTX.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            } else {
                let r = Math.min((ratio * 1.5 - kcRatio) / (1 - kcRatio), 1)
                let hue = 60 - r * 60
                let saturation = 90 + r * 10
                let lightness = 55 - r * 15
                CTX.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            }
            CTX.fillRect(barX + i, barY, 1, barH)
        }

        // Draw border
        CTX.strokeStyle = "#999999"
        CTX.lineWidth = 1
        CTX.strokeRect(barX, barY, barW, barH)

        // Draw critical density marker
        var kcX = barX + kcRatio * barW
        CTX.strokeStyle = "#333333"
        CTX.lineWidth = 1
        CTX.beginPath()
        CTX.moveTo(kcX, barY - 2)
        CTX.lineTo(kcX, barY + barH + 2)
        CTX.stroke()

        // Labels
        var barMidY = barY + barH / 2
        CTX.fillStyle = "#000000"
        CTX.font = "11px sans-serif"
        CTX.textBaseline = "middle"
        CTX.textAlign = "right"
        CTX.fillText("Empty", barX - 6, barMidY)
        CTX.textAlign = "left"
        CTX.fillText("Jam", barX + barW + 6, barMidY)
        CTX.textBaseline = "top"
        CTX.textAlign = "center"
        CTX.fillText("Density", barX + barW / 2, barY + barH + 3)
        CTX.font = "10px sans-serif"
        CTX.textBaseline = "alphabetic"
        CTX.fillText("Critical density", kcX, barY - 5)
        CTX.textAlign = "left"  // reset
    }
}

print("compare_mainloop.js END");
