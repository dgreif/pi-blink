var express = require('express');
var app = express();
var socketio = require('socket.io');
var server = app.listen(8080);
var io = socketio.listen(server);
var gpio = require("pi-gpio");
var indexFile = require('path').join(__dirname,'public','index.html');
var isOn = false;
var child = require('child_process');

var width = 160,
    height = 120;

var args = ['-s', width + 'x' + height, '-f', 'video4linux2', '-i', '/dev/video0', '-f', 'mpeg1video', '-b', '800k', '-r', '30', 'pipe:1'];
var trans_proc = child.spawn('avconv', args, null);
trans_proc.stdout.on('data',function(data){
    io.emit('image', { buffer: data });
})

trans_proc.stderr.on('data', function (data) {
    io.emit('error',data.toString());
});


app.use(express.static(require('path').join(__dirname,'public')));

app.get('/',function(req,res){
    res.sendFile(indexFile);
});

var STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes



io.on('connection',function(client){
    client.emit(isOn ? 'on' : 'off');

    var streamHeader = new Buffer(8);
    streamHeader.write(STREAM_MAGIC_BYTES);
    streamHeader.writeUInt16BE(width, 4);
    streamHeader.writeUInt16BE(height, 6);
    client.emit('image',{buffer:streamHeader});


    client.on('on',function(data){
        turnOn();
        client.broadcast.emit('on',data);
    });
    client.on('off',function(data){
        turnOff();
        client.broadcast.emit('off',data);
    });

    client.on('disconnect',function(){
        //client is gone.
    });
});

gpio.close(7, function() {
    gpio.open(7, "output", function() {
        turnOn();
    });
});


function turnOff () {
    isOn = false;
    gpio.write(7, 0);
}

function turnOn () {
    isOn = true;
    gpio.write(7, 1);
}
