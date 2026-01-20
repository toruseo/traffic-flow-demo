// CTM (Cell Transmission Model) - Macro traffic flow model
// This file provides macro-level traffic simulation based on density propagation

/**
 * MacroLink class - represents a road segment with CTM dynamics
 * Density-based simulation without individual vehicles
 *
 * Key difference from micro model:
 * - Larger cells (each cell represents multiple vehicle spaces)
 * - Density is continuous (vehicles per cell)
 * - No individual vehicle tracking
 */
class MacroLink {
    constructor(xmax, delta, px, py, plen, loop, cellSize) {
        this.xmax = xmax            // Number of macro cells (e.g., 20)
        this.cellSize = cellSize || 5  // Each macro cell = cellSize micro cells
        this.px = px                // Drawing start X
        this.py = py                // Drawing start Y
        this.plen = plen            // Drawing length
        this.pw = 12                // Drawing width
        this.pew = 6                // Edge width
        this.loop = loop            // Loop flag (0: open road, 1: ring road)
        this.delta_default = delta

        // CTM parameters (calibrated to match micro model behavior)
        // Micro model: vf = 4 micro-cells/step
        // Macro model: vf = 4/cellSize macro-cells/step = 0.8 macro-cells/step
        this.vf = 4 / this.cellSize     // Free flow speed (macro-cells/step)
        this.w = 1 / this.cellSize      // Backward wave speed (macro-cells/step)
        this.kj = this.cellSize         // Jam density (vehicles/macro-cell)

        // Critical density and max flow from triangular FD
        // kc = kj * w / (vf + w)
        this.kc = this.kj * this.w / (this.vf + this.w)
        this.qmax = this.vf * this.kc   // Maximum flow (vehicles/step)

        // State variables
        this.density = init_array(xmax, 0)      // Density array (vehicles/cell)
        this.flow = init_array(xmax + 1, 0)     // Cell boundary flow (vehicles/step)

        // Bottleneck capacity array (qmax at each cell)
        this.capacity = init_array(xmax, this.qmax)

        // Local jam density (for bottleneck)
        this.kjLocal = init_array(xmax, this.kj)

        // Delta array for bottleneck display (matching micro model interface)
        this.delta = init_array(xmax, delta)
    }

    /**
     * CTM update rule (Godunov scheme)
     * n[i](t+1) = n[i](t) + y[i](t) - y[i+1](t)
     * y[i](t) = min(S[i-1](t), R[i](t))
     *
     * Supply S = demand from upstream (sending capacity)
     * Receive R = supply to downstream (receiving capacity)
     */
    update() {
        // Calculate flows at cell boundaries
        for (let i = 0; i <= this.xmax; i++) {
            // Supply from upstream cell (sending capacity)
            let S
            if (i == 0) {
                // Upstream boundary - handled by spawner
                S = this.flow[0]  // Set by spawner
            } else {
                let k = this.density[i - 1]
                let kjL = this.kjLocal[i - 1]
                let capL = this.capacity[i - 1]
                // Supply = min(k * vf, qmax_local)
                // In free flow: S = k * vf
                // At capacity: S = qmax
                S = Math.min(k * this.vf, capL)
            }

            // Receive capacity of downstream cell
            let R
            if (i == this.xmax) {
                // Downstream boundary - free outflow
                R = this.qmax
            } else {
                let k = this.density[i]
                let kjL = this.kjLocal[i]
                let capL = this.capacity[i]
                // Receive = min(w * (kj_local - k), qmax_local)
                // In free flow: R = qmax
                // In congestion: R = w * (kj - k)
                R = Math.min(this.w * (kjL - k), capL)
                if (R < 0) R = 0
            }

            // Actual flow is minimum of supply and receive
            if (i == 0) {
                // Keep spawner-set upstream flow (but limited by receive)
                this.flow[i] = Math.min(this.flow[i], R)
            } else {
                this.flow[i] = Math.min(S, R)
            }

            // Ensure non-negative flow
            if (this.flow[i] < 0) this.flow[i] = 0
        }

        // Update densities using conservation law
        let newDensity = init_array(this.xmax, 0)
        for (let i = 0; i < this.xmax; i++) {
            newDensity[i] = this.density[i] + this.flow[i] - this.flow[i + 1]
            // Clamp density to valid range
            if (newDensity[i] < 0) newDensity[i] = 0
            if (newDensity[i] > this.kjLocal[i]) newDensity[i] = this.kjLocal[i]
        }
        this.density = newDensity
    }

    /**
     * Set bottleneck by reducing local capacity and jam density
     * deltaValue: 1 = no bottleneck, 2 = light, 4 = heavy
     */
    set_bottleneck(x0, x1, deltaValue) {
        // Map delta to capacity reduction
        // delta=1: full capacity, delta=2: half, delta=4: quarter
        let ratio = 1 / deltaValue

        for (let x = x0; x < x1; x++) {
            if (x >= 0 && x < this.xmax) {
                this.capacity[x] = this.qmax * ratio
                this.kjLocal[x] = this.kj * ratio
                this.delta[x] = deltaValue
            }
        }
    }

    /**
     * Reset all cells to default capacity
     */
    reset_bottleneck() {
        for (let x = 0; x < this.xmax; x++) {
            this.capacity[x] = this.qmax
            this.kjLocal[x] = this.kj
            this.delta[x] = this.delta_default
        }
    }

    /**
     * Set delta for display (matching micro model interface)
     */
    set_delta(x0, x1, delta) {
        this.set_bottleneck(x0, x1, delta)
    }

    /**
     * Draw link with density as color gradient
     * Color: Green (free flow) -> Yellow (medium) -> Red (congested)
     */
    draw() {
        // Draw road background
        CTX.fillStyle = "#aaaaaa"
        CTX.fillRect(this.px, this.py - this.pew, this.plen, this.pw + this.pew * 2)

        // Draw bottleneck area (narrowing visual)
        for (let x = 0; x < this.xmax; x++) {
            if (this.delta[x] > this.delta_default) {
                let pad
                if (this.delta[x] == 2) {
                    pad = 4
                } else if (this.delta[x] == 4) {
                    pad = 1
                } else {
                    pad = 3
                }
                let cellWidth = this.plen / this.xmax
                CTX.fillStyle = "#eeeeee"
                CTX.fillRect(this.px + cellWidth * x, this.py - this.pew, cellWidth, this.pew - pad)
                CTX.fillRect(this.px + cellWidth * x, this.py + this.pw + this.pew, cellWidth, -this.pew + pad)
            }
        }

        // Draw density as color gradient
        for (let i = 0; i < this.xmax; i++) {
            let k = this.density[i]
            let kjL = this.kjLocal[i]
            let ratio = k / kjL  // 0 to 1 (normalized density)
            if (ratio > 1) ratio = 1

            // HSL: Green(120) for free flow, Yellow(60) for medium, Red(0) for congested
            let hue = 120 - ratio * 120
            CTX.fillStyle = `hsl(${hue}, 100%, 50%)`

            let cellWidth = this.plen / this.xmax
            let x = this.px + i * cellWidth
            CTX.fillRect(x, this.py, cellWidth + 1, this.pw)  // +1 to avoid gaps
        }

        // Draw cell boundaries (subtle grid lines)
        CTX.strokeStyle = "rgba(0,0,0,0.1)"
        CTX.lineWidth = 1
        for (let i = 1; i < this.xmax; i++) {
            let x = this.px + i * this.plen / this.xmax
            CTX.beginPath()
            CTX.moveTo(x, this.py)
            CTX.lineTo(x, this.py + this.pw)
            CTX.stroke()
        }
    }
}

/**
 * MacroSpawner class - controls upstream boundary flow
 */
class MacroSpawner {
    constructor(link, flow, fmax) {
        this.link = link
        this.flow = flow
        this.fmax = fmax || 1
        this.fmin = 0
    }

    update() {
        // Set upstream boundary flow
        this.link.flow[0] = this.flow

        // Clamp flow to valid range
        if (this.flow > this.fmax) {
            this.flow = this.fmax
        }
        if (this.flow < this.fmin) {
            this.flow = this.fmin
        }
    }

    draw() {
        draw_text("inflow = " + this.flow.toFixed(2), this.link.px, this.link.py - 20, "#000000", 12)
    }
}

/**
 * MacroFDchanger class - changes capacity for bottleneck region
 */
class MacroFDchanger {
    constructor(link, x0, x1) {
        this.link = link
        this.x0 = x0
        this.x1 = x1
        this.delta = 1  // Initial delta value (no bottleneck)
    }

    update() {
        // First reset all to default
        this.link.reset_bottleneck()

        // Then apply bottleneck if delta > 1
        if (this.delta > 1) {
            this.link.set_bottleneck(this.x0, this.x1, this.delta)
        }
    }
}
