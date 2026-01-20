let isPaused = false

window.onload = function() {
    // Toggle pause when the pause button is clicked
    document.getElementById('pauseButton').addEventListener('click', function() {
        isPaused = !isPaused;
    });
};

function MAINLOOP(time){
    if (!isPaused) {
        const elapsedTime = time - prevTime;
        if (elapsedTime >= 1000) {
        count = 0;
        prevTime = time;
        }  
        count++;
        //use of requestAnimationFrame: adapted from https://zenn.dev/baroqueengine/books/a19140f2d9fc1a/viewer/ebed0a

        if(T%DELTAT == 0){
            updates()
        }
        
        if(T%DELTAT_DRAW == 0){
            draws()
        }

        if(T%DELTAT_EDIE == 0){
            edies()
        }
        
        T++
    }
    requestAnimationFrame(MAINLOOP);
}


function updates(){    
    for(let link of LINKS){
        link.update()
    }

    for(let fdc of FDCHANGERS){
        if(document.getElementById("bn_none") != null){
            fdc.delta = document.getElementsByName("bn_impact").item(0).checked*1 + document.getElementsByName("bn_impact").item(1).checked*2 + document.getElementsByName("bn_impact").item(2).checked*4
        }
        fdc.update()
    }

    for(let veh of VEHS){
        veh.speed_change()
    }
    for(let veh of VEHS){
        veh.update()
    }
    for(let s of SPAWNERS){
        s.flow = Number(document.getElementById("inflow").value)/100
        document.getElementById("inflow_value").innerHTML = s.flow.toFixed(2)
        s.update()
    }
    for(let r of REGULATORS){
        r.num = Number(document.getElementById("num").value)
        document.getElementById("num_value").innerHTML = r.num.toFixed(0)
        r.update()
    }
    
    if(document.getElementsByName("model").item(1).checked == 0){
        ACC = 999
        DECEL_PROB = 0
        for(let veh of VEHS){
            veh.acc = ACC
            veh.decel_prob = DECEL_PROB
        }
    }else{
        ACC = 1
        DECEL_PROB = 0.05
        for(let veh of VEHS){
            veh.acc = ACC
            veh.decel_prob = DECEL_PROB
        }
    }

    var VEHS_new = []
    for(let veh of VEHS){
        if(veh.flag_delete != 1){
            VEHS_new.push(veh)
        }
    }
    VEHS = VEHS_new   
    
    for(let tsp of TSPLOTS){
        tsp.update()
    }

    for(let cp of CUMPLOTS){
        cp.update()
    }
}

function draws(){
    CTX.fillStyle = "#eeeeee"
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height)

    for(let qkp of QKPLOTS){
        if(document.getElementById("flow_density").checked == 1){
            qkp.draw()
        }
    }

    for(let link of LINKS){
        link.draw()

        if(document.getElementById("traffic_state").checked == 1){
            link.draw_trafficstate()            
        }
    }

    for(let veh of VEHS){
        veh.draw()
    }

    for(let s of SPAWNERS){
        s.draw()
    }

    if(document.getElementById("ts_diagram_trajects").checked == 1 || document.getElementById("ts_diagram_state").checked == 1){
        if(CANVAS.height != 590 && CANVAS.height != 860){
            CANVAS.height = 590
        }
        for(let tsp of TSPLOTS){
            tsp.draw(
                document.getElementById("ts_diagram_trajects").checked, 
                document.getElementById("ts_diagram_state").checked,
                document.getElementsByName("ts_diagram_state_which").item(0).checked*100 + document.getElementsByName("ts_diagram_state_which").item(1).checked*10 + document.getElementsByName("ts_diagram_state_which").item(2).checked*1
            )
        }
    }

    if(document.getElementById("cumlative").checked == 1){
        if(CANVAS.height != 860){
            CANVAS.height = 860
        }
        for(let cp of CUMPLOTS){
            cp.draw()
        }
    }
}

function edies(){    
    for(let link of LINKS){
        link.calc_edie()
    }
    for(let qkp of QKPLOTS){
        if(document.getElementById("flow_density").checked == 1){
            qkp.add_qk()
        }
    }
    for(let tsp of TSPLOTS){
        tsp.collect_states()
    }
}