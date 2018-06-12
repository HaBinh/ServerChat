var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
server.listen(3000);

//socket
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
        if (clients[data.roomId]) {
            io.sockets.connected[clients[data.roomId].socket].emit("call", {
                "roomId": socket.handshake.query.token
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

//Mysql config
var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "simpleChat"
});

con.connect(function (err) {
    if (err) {
        console.log(err)
    } else {
        console.log("connected!!!");
    }
});

//Api
var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
var body = {};
app.post('/user/login', function (req, res) {
    var sql = 'SELECT id, firstName, lastName, createdAt FROM User WHERE userName = ? and password = ?';
    var param = [req.body.userName, req.body.password];
    con.query(sql, param, function (err, result) {
        console.log(result);
        if (result != null && result != '') {
            body.status = 200;
            body.message = 'Success';
            body.data = result[0];
            res.send(body);
        } else {
            body.status = 201;
            body.message = 'userName or password is wrong';
            body.data = null;
            res.send(body);
        }
    });
});

app.post('/user/register', function (req, res) {
    var sql = 'SELECT * FROM User WHERE userName = ?';
    var param = [req.body.userName];
    con.query(sql, param, function (err, result) {
        if (result == null || result == '') {
            sql = 'INSERT INTO User (userName, password, firstName, lastName) VALUES (?, ?, ?, ?)';
            param = [req.body.userName, req.body.password, req.body.firstName, req.body.lastName];
            con.query(sql, param, function (err, result) {
                if (err) {
                    body.status = 201;
                    body.message = err;
                    body.data = null;
                    res.send(body);
                } else {
                    body.status = 200;
                    body.message = 'Success';
                    body.data = {
                        'id': result.insertId
                    };
                    res.send(body);
                }
            });
        } else {
            console.log(result);
            body.status = 201;
            body.message = 'Duplicate userName';
            body.data = null;
            res.send(body);
        }
    });
});

/**
 * [
 *  {
 *      "roomId": 1,
 *      "users": [
 *          {
 *              "id" : 5,
 *              "userName" : "dungpv",
 *              "firstName" : "Pham",
 *              "lastName" : "Dung"
 *          }
 *      ]
 *  }
 * ]
 */
app.get('/rooms', async function (req, res) {
    var sql = 'SELECT Rooms.id FROM Rooms INNER JOIN RoomUsers ON Rooms.id = RoomUsers.idRoom WHERE RoomUsers.idUser = ?';
    var param = [req.headers.authorization];
    var result = await query(sql, param);
    var rooms = [];
    const roomIds = result.map(room => room.id);
    sql = 'SELECT User.id, User.userName, User.firstName, User.lastName FROM User INNER JOIN RoomUsers ON User.id = RoomUsers.idUser WHERE RoomUsers.idRoom = ?';
    for (var i = 0; i < roomIds.length; i++) {
        param = [roomIds[i]];
        var users = await query(sql, param);
        var room = {
            "roomId" : roomIds[i],
            'users': users
        };
        rooms.push(room);
    }
    body.status = 200;
    body.message = 'Success';
    body.data = {
        'rooms' : rooms
    };
    res.send(body);
});

function query(sql, param) {
    return new Promise((resolve, reject) => {
        con.query(sql, param, function (err, result) {
            if(err) {
                reject(err);
            }
            resolve(result);
        });
    })
}