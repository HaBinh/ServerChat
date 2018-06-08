var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
server.listen(process.env.PORT || 3000);

var clients = {};
io.sockets.on('connection', function (socket) {
    console.log("user %s connected", socket.handshake.query.token);
    clients[socket.handshake.query.token] = {
        "socket": socket.id
    };

    socket.on('sendMessage', function (data) {
        if (clients[data.roomId]) {
            io.sockets.connected[clients[data.roomId].socket].emit("receiverMessage", data);
        }
    });

    socket.on('call', function (data) {
        //console.log('call' + data.roomId);
        if (clients[data.roomId]) {
            io.sockets.connected[clients[data.roomId].socket].emit("call", {
                "roomId" : socket.handshake.query.token
            });
        }
    });

    socket.on('callContent', function (data) {
        if (clients[data.roomId]) {
            io.sockets.connected[clients[data.roomId].socket].emit("callContent", data);
        }
    });

    socket.on('callAccept', function (data) {
        if (clients[data.roomId]) {
            io.sockets.connected[clients[data.roomId].socket].emit("callAccept", data);
        }
    });

    socket.on('callStop', function (data) {
        if (clients[data.roomId]) {
            io.sockets.connected[clients[data.roomId].socket].emit("callStop", data);
        }
    });

    //Removing the socket on disconnect
    socket.on('disconnect', function () {
        for (var name in clients) {
            if (clients[name].socket === socket.id) {
                delete clients[name];
                break;
            }
        }
    });
});