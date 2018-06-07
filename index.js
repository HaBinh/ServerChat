var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
server.listen(process.env.PORT || 3000);

var clients = {};
io.sockets.on('connection', function (socket) {
    console.log("Have user connected")

    socket.on('login', function (data) {
        clients[data.username] = {
            "socket": socket.id
        };
    });

    socket.on('sendMessage', function (data) {
        console.log("Sending: " + data.content + " to " + data.username);
        if (clients[data.username]) {
            io.sockets.connected[clients[data.username].socket].emit("receiverMessage", data);
        } else {
            console.log("User does not exist: " + data.username);
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