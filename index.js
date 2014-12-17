var express = require('express');
var app = express();
var socketio = require('socket.io');
var server = app.listen(8080);
var io = socketio.listen(server);
var gpio = require("pi-gpio");
var indexFile = require('path').join(__dirname,'public','index.html');
var isOn = false;

app.get('/',function(req,res){
    res.sendFile(indexFile);
});

app.post('/on', turnOn);

io.on('connection',function(client){
    client.emit(isOn ? 'on' : 'off');

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
