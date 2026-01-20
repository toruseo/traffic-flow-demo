class Vehicle{
    constructor(x, v, link){
        this.x = x
        this.v = v
        this.x_next = x
        this.x_old = 100
        this.link = link
        this.link.set_vehicle(x, 1)
        
        this.idx = VEH_IDX
        VEH_IDX++

        this.vmax = VMAX
        this.acc = ACC
        this.decel_prob = DECEL_PROB
        this.color = "#"+Math.floor(Math.random()*256*256*256).toString(16)

        this.flag_delete = 0
    }

    speed_change(){
        this.v += this.acc
        if(this.v > this.vmax){
            this.v = this.vmax
        }
        if(this.v > 0){
            for(let x=this.x+1;  x<=this.x+this.v+1; x++){
                if(this.link.get_vehicle(x) == 1){
                    var delta = this.link.get_delta(x)
                    this.v = x-this.x-delta
                    break
                }
            }
        }
        if(Math.random() < this.decel_prob){
            this.v --
        }
        if(this.v < 0){
            this.v = 0
        }
    }

    move(){
        this.link.set_vehicle(this.x, 0)
        this.x_old = this.x

        //edie記録
        if(this.v > 0){
            for(let x=this.x; x<this.x+this.v; x++){
                this.link.add_ds(x, 1)
                this.link.add_ts(x, 1/this.v)
            }
        }else{
            this.link.add_ts(this.x, 1)
        }

        this.x += this.v

        if(this.x >= this.link.xmax){
            if(this.link.loop == 1){
                this.x -= this.link.xmax
            }else{
                this.x = -1000
                this.flag_delete = 1
            }
        }

        this.link.set_vehicle(this.x, 1)
    }

    draw_self(x){
        let px = this.link.px + x/this.link.xmax*this.link.plen
        let py = this.link.py
        let pxsize = this.link.plen/this.link.xmax
        let pysize = this.link.pw
        
        CTX.fillStyle = this.color
        CTX.beginPath()
        CTX.moveTo(px, py)
        CTX.lineTo(px+pxsize/2, py)
        CTX.lineTo(px+pxsize, py+pysize/2)
        CTX.lineTo(px+pxsize/2, py+pysize)
        CTX.lineTo(px, py+pysize)
        CTX.closePath()
        CTX.fill()
        CTX.strokeStyle = "#000000"
        CTX.stroke()
    }

    draw(){
        var a = (T%DELTAT)/DELTAT
        var x = this.x_old*(1-a) + this.x*a 
        if(this.x_old <= this.x){
            this.draw_self(x)
        }
    }

    update(){
        this.move()
    }
}

class Link{
    constructor(xmax, delta, px, py, plen, loop){
        this.xmax = xmax
        this.delta = Array(this.xmax) //ローカルFD変数
        this.delta.fill(delta)
        this.delta_default = delta
        this.vehs = Array(this.xmax) //車両が居たら1になる配列
        this.vehs.fill(0)
        this.loop = loop
        this.px = px
        this.py = py
        this.plen = plen
        this.pw = 12
        this.pew = 6

        this.deltat = DELTAT_EDIE/DELTAT
        this.deltaxsize = 10
        this.deltax = this.xmax/this.deltaxsize
        this.ts = init_array(this.deltaxsize, 0)
        this.ds = init_array(this.deltaxsize, 0)
        this.ts.fill(0)
        this.ds.fill(0)
        this.A = this.deltat*this.deltax

        this.q = init_array(this.deltaxsize, 0)
        this.k = init_array(this.deltaxsize, 0)
        this.v = init_array(this.deltaxsize, 0)
    }

    get_vehicle(x){
        if(this.loop == 1){
            return this.vehs[x%this.xmax]
        }else{
            if(0 <= x && x < this.xmax){
                return this.vehs[x]
            }else{
                return 0
            }
        }
    }

    set_vehicle(x, val){
        if(this.loop == 1){
            this.vehs[x%this.xmax] = val
        }else{
            if(0 <= x && x < this.xmax){
                this.vehs[x] = val
            }
        }
    }

    get_delta(x){
        if(this.loop == 1){
            return this.delta[x%this.xmax]
        }else{
            if(0 <= x && x < this.xmax){
                return this.delta[x]
            }else{
                return 1
            }
        }
    }

    set_delta(x0, x1, delta){
        for(let x=x0; x<x1; x++){
            this.delta[x] = delta
        }
    }

    add_ts(x, val){
        if(this.loop == 1){
            this.ts[Math.floor((x%this.xmax)/this.deltax)] += val
        }else if(x < this.xmax){
            this.ts[Math.floor(x/this.deltax)] += val
        }
    }

    add_ds(x, val){
        if(this.loop == 1){
            this.ds[Math.floor(x%this.xmax/this.deltax)] += val
        }else if(x < this.xmax){
            this.ds[Math.floor(x/this.deltax)] += val
        }
    }

    calc_edie(){
        for(let i=0; i<this.deltaxsize; i++){
            this.q[i] = this.ds[i]/this.A
            this.k[i] = this.ts[i]/this.A
            if(this.ts[i] != 0){
                this.v[i] = this.ds[i]/this.ts[i]
            }else{
                this.v[i] = VMAX
            }
        }
        this.ts.fill(0)
        this.ds.fill(0)
    }

    draw_trafficstate(){
        var py0 = 40
        var pdy = 18
        var pdx = 1/this.deltaxsize*this.plen
        var pad = -2
        var q_ref = 1
        var k_ref = 1
        var v_ref = 3
        draw_text("flow", this.px-30, this.py+py0, "#000000", 12)
        draw_text("density", this.px-30, this.py+py0+pdy, "#000000", 12)
        draw_text("speed", this.px-30, this.py+py0+pdy*2, "#000000", 12)

        for(let i=0; i<this.deltaxsize; i++){
            var px = this.px+(i+0.5)/this.deltaxsize*this.plen
            var cq = -this.q[i]/q_ref*50+100
            var ck = -this.k[i]/k_ref*50+100
            var cv = -this.v[i]/v_ref*50+100

            draw_rect(px-pdx/2, this.py+py0-pdy/2 +pad, pdx, pdy, `hsl(240, 100%, ${cq}%)`)
            draw_rect(px-pdx/2, this.py+py0+pdy-pdy/2 +pad, pdx, pdy, `hsl(0, 100%, ${ck}%)`)
            draw_rect(px-pdx/2, this.py+py0+pdy*2-pdy/2 +pad, pdx, pdy, `hsl(120, 100%, ${cv}%)`)
            draw_rect_edge(px-pdx/2, this.py+py0+pdy-pdy/2 +pad, pdx, pdy, "#aaaaaa")
            draw_rect_edge(px-pdx/2, this.py+py0-pdy/2 +pad, pdx, pdy, "#aaaaaa")
            draw_rect_edge(px-pdx/2, this.py+py0+pdy*2-pdy/2 +pad, pdx, pdy, "#aaaaaa")

            draw_text(this.q[i].toFixed(2), px, this.py+py0, "#000000", 12)
            draw_text(this.k[i].toFixed(2), px, this.py+py0+pdy, "#000000", 12)
            draw_text(this.v[i].toFixed(2), px, this.py+py0+pdy*2, "#000000", 12)
        }
    }

    draw(){
        CTX.fillStyle = "#aaaaaa"
        CTX.fillRect(this.px, this.py-this.pew, this.plen, this.pw+this.pew*2)
        var pad = 3

        for(let x=0; x<this.xmax; x++){
            if(this.delta[x] > this.delta_default){
                if(this.delta[x] == 2){
                    var pad = 4
                }else if(this.delta[x] == 4){
                    var pad = 1
                }
                CTX.fillStyle = "#eeeeee"
                CTX.fillRect(this.px+this.plen*x/this.xmax, this.py-this.pew, this.plen/this.xmax, this.pew-pad)
                CTX.fillRect(this.px+this.plen*x/this.xmax, this.py+this.pw+this.pew, this.plen/this.xmax, -this.pew+pad)
            }
        }
    }

    update(){
        //何もしない
    }
}

class FDchanger{
    constructor(link, x0, x1){
        this.link = link
        this.x0 = x0
        this.x1 = x1
        this.delta = 2
    }

    update(){
        this.link.set_delta(this.x0, this.x1, this.delta)
    }
}

class Spawner{
    constructor(link, flow, fmax){
        this.link = link
        this.flow = flow
        this.fmax = fmax
        this.fmin = 0
        this.cumvalue = 1
    }

    draw(){
        draw_text("inflow = "+this.flow.toFixed(2), this.link.px, this.link.py-20, "#000000", 12)
    }

    update(){
        this.cumvalue += this.flow
        if(this.cumvalue > 1){
            if(this.link.get_vehicle(0) == 0){
                VEHS.push(new Vehicle(0, VMAX, this.link))
            }
            this.cumvalue --
        }

        if(this.cumvalue > 1){
            this.cumvalue = 1
        }
        if(this.flow > this.fmax){
            this.flow = this.fmax
        }
        if(this.flow < this.fmin){
            this.flow = this.fmin
        }

    }
}

class Regulator{
    constructor(link, num, nmax){
        this.link = link
        this.num = num
        this.nmax = nmax
        this.nmin = 0
        this.cumvalue = 1
    }

    update(){
        while(1){
            var num_current = sum(this.link.vehs)
            if(num_current < this.num){
                for(let x=0; x<this.link.xmax; x++){
                    if(this.link.get_vehicle(x) == 0){
                        VEHS.push(new Vehicle(x, VMAX, this.link))
                        break
                    }
                }
            }else if(num_current > this.num){
                var idx = Math.floor(Math.random()*VEHS.length)
                VEHS[idx].link.set_vehicle(VEHS[idx].x, 0)
                VEHS.splice(idx, 1)
            }else{
                break
            }
        }
    }
}

class QKplot{
    constructor(x0, y0, xsize, ysize, link, i, drawarrow, mfd){
        this.x0 = x0
        this.y0 = y0
        this.xsize = xsize
        this.ysize = ysize
        this.drawarrow = drawarrow

        this.mfd = mfd

        this.qs = []
        this.ks = []

        this.qsize = 1
        this.ksize = 1

        this.link = link
        this.i = i

        this.x_old = -1
        this.y_old = -1
    }

    add_qk(){
        if(this.mfd == 0){
            var q = this.link.q[Math.floor(this.i/this.link.deltax)]
            var k = this.link.k[Math.floor(this.i/this.link.deltax)]
        }else{
            var q = sum(this.link.q)/this.link.q.length
            var k = sum(this.link.k)/this.link.k.length
        }
        var x = k/this.ksize*this.xsize
        var y = -q/this.qsize*this.ysize
        
        this.ks.push(x)
        this.qs.push(y)

        draw_circle(this.x0+x, this.y0+y, 4, "#ff0000")
    }

    draw(){
        if(this.mfd == 0){
            CTX.fillStyle = "#ffffff"
            CTX.fillRect(this.x0-40, this.y0-this.ysize-10, this.xsize+50, this.ysize+30)
            draw_line(this.x0,this.y0,this.x0+this.xsize,this.y0,1,"#000000")
            draw_line(this.x0,this.y0,this.x0,this.y0-this.ysize,1,"#000000")
            draw_text("density", this.x0+this.xsize/2, this.y0+10, "#000000", 12)
            draw_text("flow", this.x0-24, this.y0-this.ysize/2, "#000000", 12)
        }else{
            CTX.fillStyle = "#ffffff"
            CTX.fillRect(this.x0-70, this.y0-this.ysize-10, this.xsize+90, this.ysize+30)
            draw_line(this.x0,this.y0,this.x0+this.xsize,this.y0,1,"#000000")
            draw_line(this.x0,this.y0,this.x0,this.y0-this.ysize,1,"#000000")
            draw_text("area-density", this.x0+this.xsize/2, this.y0+10, "#000000", 12)
            draw_text("area-flow", this.x0-36, this.y0-this.ysize/2, "#000000", 12)
        }

        if(this.drawarrow == 1){
            if(this.mfd == 0){
                let x_to = this.link.px+this.link.plen*(this.i+this.link.deltax/2)/this.link.xmax
                draw_line(this.x0+this.xsize/2, this.y0-this.ysize-15, x_to, this.y0-this.ysize-30, 1, "#000000")
                draw_line(x_to, this.y0-this.ysize-30, x_to, this.link.py+30, 1, "#000000")
            }
        }

        for(let i=0; i<this.qs.length; i++){
            draw_circle(this.x0+this.ks[i], this.y0+this.qs[i], 4, "#cccccc")
        }
        draw_circle(this.x0+this.ks[this.ks.length-1], this.y0+this.qs[this.ks.length-1], 4, "#ff0000")

    }

    update(){
        //何もしない
    }
}

class TSplot{
    constructor(link){
        this.link = link
        this.px = 100 //左下座標
        this.py = 540
        this.pxsize = 600 //横縦サイズ
        this.pysize = 200

        this.deltat = Math.floor(this.pxsize/this.pysize*this.link.xmax)

        this.trajects = {}

        this.q_mat = init_array(Math.floor(this.deltat/(DELTAT_EDIE/DELTAT)), [])
        for(let i=0; i<this.q_mat.length; i++){
            this.q_mat[i] = init_array(this.link.deltaxsize, 0)
        }
        this.k_mat = init_array(Math.floor(this.deltat/(DELTAT_EDIE/DELTAT)), [])
        for(let i=0; i<this.k_mat.length; i++){
            this.k_mat[i] = init_array(this.link.deltaxsize, 0)
        }
        this.v_mat = init_array(Math.floor(this.deltat/(DELTAT_EDIE/DELTAT)), [])
        for(let i=0; i<this.v_mat.length; i++){
            this.v_mat[i] = init_array(this.link.deltaxsize, 0)
        }
    }

    collect_trajects(){
        for(let veh of VEHS){
            if(Object.keys(this.trajects).includes(veh.idx.toString()) == 0){
                this.trajects[veh.idx] = [veh.color]
            }
            this.trajects[veh.idx].push(T/DELTAT)
            this.trajects[veh.idx].push(veh.x)
        }
    }

    collect_states(){
        var t = Math.floor((T/DELTAT)%this.deltat/(DELTAT_EDIE/DELTAT))
        for(let i=0; i<this.link.deltaxsize; i++){
            this.q_mat[t][i] = this.link.q[i]
        }
        for(let i=0; i<this.link.deltaxsize; i++){
            this.k_mat[t][i] = this.link.k[i]
        }
        for(let i=0; i<this.link.deltaxsize; i++){
            this.v_mat[t][i] = this.link.v[i]
        }
    }

    draw_trajects(){
        for(let idx of Object.keys(this.trajects)){
            if(this.trajects[idx].length >= 4){
                CTX.beginPath()
                CTX.lineWidth = 1
                CTX.strokeStyle = this.trajects[idx][0]
                var flag_line_start = 1
                var t = -100
                var x = 100
                
                for(let i=1; i<this.trajects[idx].length-2; i+=2){
                    var t_old = t
                    var x_old = x
                    t = this.trajects[idx][i]
                    x = this.trajects[idx][i+1]
                    t = t%this.deltat/this.deltat*this.pxsize + this.px
                    x = -x/this.link.xmax*this.pysize + this.py
                    
                    if(t_old > t || x_old < x){
                        CTX.stroke()
                        CTX.beginPath()
                        flag_line_start = 1
                    }

                    if(flag_line_start == 1){
                        CTX.moveTo(t, x)
                        flag_line_start = 0
                    }else{
                        CTX.lineTo(t, x)
                    }
                }
                CTX.stroke()
            }
        }
    }

    draw_state(state_mat){
        var dx = this.pxsize/state_mat.length
        var dy = this.pysize/state_mat[0].length

        if(state_mat == this.q_mat){
            var ref = 1
            var color = function(val){
                var cq = -val/ref*50+100
                return `hsl(240, 100%, ${cq}%)`
            }   
        }else if(state_mat == this.k_mat){
            var ref = 1
            var color = function(val){
                var ck = -val/ref*50+100
                return `hsl(0, 100%, ${ck}%)`
            }   
        }else if(state_mat == this.v_mat){
            var ref = 3
            var color = function(val){
                //var cv = val/ref*50+50
                var cv = -val/ref*50+100
                return `hsl(120, 100%, ${cv}%)`
            }
        }
        for(let t=1; t<state_mat.length; t++){
            for(let i=0; i<state_mat[t].length; i++){
                draw_rect(this.px+dx*(t-1), this.py-dy*i, dx+1, -dy, color(state_mat[t][i]))
            }
        }
    }

    draw(trajects, state, state_which){
        var pad = 20
        draw_rect(this.px-pad*2.5, this.py-this.pysize-pad, this.pxsize+pad*3.5, this.pysize+pad*2, "#ffffff")

        if(state == 1){
            if(state_which == 100){
                this.draw_state(this.q_mat)
            }else if(state_which == 10){
                this.draw_state(this.k_mat)
            }else if(state_which == 1){
                this.draw_state(this.v_mat)
            }else{
                //print(state, state_which)
            }
        }
        if(trajects == 1){
            this.draw_trajects()
        }
        
        draw_line(this.px, this.py, this.px+this.pxsize, this.py, 1, "#000000")
        draw_line(this.px, this.py, this.px, this.py-this.pysize, 1, "#000000")
        draw_text("time", this.px+this.pxsize/2, this.py+12, "#000000", 12)
        draw_text("space", this.px-24, this.py-this.pysize/2, "#000000", 12)
    }

    update(){
        if(T/DELTAT%this.deltat == 0){
            this.trajects = {}

            for(let i=0; i<this.k_mat.length; i++){
                this.q_mat[i].fill(0)
                this.k_mat[i].fill(0)
                this.v_mat[i].fill(0)
            }
        }
        this.collect_trajects()
    }
}

class Cumplot{
    constructor(link, xs, labels, colors, shifts){
        this.link = link
        this.px = 100 //左下座標
        this.py = 810
        this.pxsize = 600 //横縦サイズ
        this.pysize = 200
        this.deltat = Math.floor(this.pxsize/this.pysize*this.link.xmax)

        this.nsize = 180

        this.xs = xs
        this.labels = labels
        this.colors = colors
        this.shifts = shifts
        this.exist_old = []
        this.cum = []
        for(let i=0; i<this.xs.length; i++){
            this.exist_old.push(0)
            this.cum.push(init_array(this.deltat*2, 0))
        }
        // this.exist_old = [0, 0, 0]
        // this.cum = [[0], [0], [0]]
    }

    collect_cums(){
        for(let i=0; i<this.xs.length; i++){
            var x = this.xs[i]
            var flag_passed = 0
            for(let veh of VEHS){
                if(veh.x_old < x && x <= veh.x){
                    this.cum[i].push(this.cum[i][this.cum[i].length-1]+1)
                    flag_passed = 1
                    break
                }
            }
            if(flag_passed == 0){
                this.cum[i].push(this.cum[i][this.cum[i].length-1])
            }
        }
    }

    draw(){
        var pad = 20
        draw_rect(this.px-pad*3.5, this.py-this.pysize-pad, this.pxsize+pad*5.5, this.pysize+pad*2, "#ffffff")
        
        for(let i=0; i<this.xs.length; i++){
            CTX.beginPath()
            CTX.lineWidth = 1
            CTX.strokeStyle = this.colors[i]
            var shift = this.shifts[i]
            
            for(let t=this.deltat; t<this.cum[i].length; t++){
                var t0 = t-this.deltat
                var n0 = this.cum[i][Math.floor(t-shift)]
                var tt = this.px + (t0)%this.deltat/this.deltat*this.pxsize
                var nn = this.py - n0/this.nsize*this.pysize
                if(t0 == 0){
                    CTX.moveTo(tt, nn)
                }else if(t > 0){
                    if(nn >= this.py - this.pysize-pad){
                        CTX.lineTo(tt, nn)
                    }
                }
            }
            CTX.stroke()
        }

        for(let i=0; i<this.xs.length; i++){
            draw_line(this.px+20, this.py-this.pysize+10+14*i, this.px+40, this.py-this.pysize+10+14*i, 1, this.colors[i])
            draw_text(this.labels[i], this.px+45, this.py-this.pysize+10+14*i, "#000000", 12, "left")
        }

        draw_line(this.px, this.py, this.px+this.pxsize, this.py, 1, "#000000")
        draw_line(this.px, this.py, this.px, this.py-this.pysize, 1, "#000000")
        draw_text("time", this.px+this.pxsize/2, this.py+12, "#000000", 12)
        draw_text("cumlative", this.px-36, this.py-this.pysize/2-6, "#000000", 12)
        draw_text("count", this.px-36, this.py-this.pysize/2+6, "#000000", 12)
    }

    update(){
        this.collect_cums()

        if(T/DELTAT%this.deltat == 0){
            var mincum = this.cum[this.cum.length-1][this.cum[0].length-1]
            for(let i=0; i<this.xs.length; i++){
                this.cum[i] = this.cum[i].slice(this.deltat, this.deltat*2)
                for(let j=0; j<this.cum[i].length; j++){
                    this.cum[i][j] -= mincum
                }
            }
        }
    }
}