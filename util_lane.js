var print = console.log

function sum(arr){
    return arr.reduce(function(sum, element){
        return sum + element
    }, 0)
}

function init_array(length, init){
    var arr = Array(length)
    arr.fill(init)
    return arr
}

function draw_rect(x,y,dx,dy,c){
    CTX.fillStyle = c
    CTX.fillRect(x, y, dx, dy)
}

function draw_rect_edge(x,y,dx,dy,c){
    CTX.strokeStyle = c
    CTX.strokeRect(x, y, dx, dy)
}

function draw_circle(x,y,r,c){
    CTX.fillStyle = c
    CTX.beginPath()
    CTX.arc(x,y,r,0,2*Math.PI)
    CTX.closePath()
    CTX.fill()
}

function draw_line(x0,y0,x1,y1,w,c){
    CTX.beginPath()
    CTX.moveTo(x0, y0)
    CTX.lineTo(x1, y1)
    CTX.lineWidth = w 
    CTX.strokeStyle = c
    CTX.stroke()
}

function draw_text(text, x, y, c, fontsize, textAlign="center"){
    CTX.fillStyle = c
    CTX.font = fontsize + "px " + "sans-serif"
    CTX.textBaseline = "middle"
    CTX.textAlign = textAlign
    CTX.fillText(text, x, y)
}
