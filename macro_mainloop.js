print("macro_mainloop.js START")

var isPaused = false
var count = 0
var prevTime = 0

window.onload = function() {
    // Toggle pause when the pause button is clicked
    document.getElementById('pauseButton').addEventListener('click', function() {
        isPaused = !isPaused
        this.textContent = isPaused ? 'Resume' : 'Pause / Resume'
    })

    // Inflow slider update display
    document.getElementById("inflow").addEventListener("input", function() {
        document.getElementById("inflow_value").innerHTML = (this.value / 100).toFixed(2)
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

        if (T % DELTAT == 0) {
            updates()
        }
        if (T % DELTAT_DRAW == 0) {
            draws()
        }
        T++
    }
    requestAnimationFrame(MAINLOOP)
}

function updates() {
    // Update spawners with inflow value from slider
    var inflowValue = Number(document.getElementById("inflow").value) / 100
    document.getElementById("inflow_value").innerHTML = inflowValue.toFixed(2)
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

function draws() {
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

print("macro_mainloop.js END")
