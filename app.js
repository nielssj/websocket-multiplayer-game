"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var nodehttp = require('http');
var socketio = require("socket.io");
var r = require("rethinkdb");

var UserRepository = require("./db/userRepository");
var GameRepository = require("./db/gameRepository");

var GamesManager = require("./gamesManager");

var authentication = require("./handlers/authentication");
var memoryHandler = require("./handlers/gamesHandler");

var app = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended:true }))
    .use(cors());

var http = nodehttp.Server(app);
var io = socketio(http);

var users;
var games;
var gamesManager;

app.get('/memory/player', function(req, res) {
    let playerId = req.user.id;
    users.findOne({id:playerId})
        .then(res.json)
        .catch(err => {
            errorHandling(res, err);
        });
});

// Conncet to database
r.connect({ host:"172.17.0.2", port:28015 })
    .then(conn => {
        // Initialize repositories
        games = new GameRepository(conn);
        users = new UserRepository(conn);
        // Initialize GamesManager
        gamesManager = new GamesManager(users, io, games);
        // Initialize handlers
        authentication(app, users);
        memoryHandler(app, gamesManager);
        // Start listening for requests
        http.listen(3000, function() {
            var port = http.address().port;
            console.log("Example app listening at http://localhost:%s", port);
        });
    })
    .catch(err => console.log("Failed to start server: " + err));

function errorHandling(res, err) {
    if(err) {
        switch (err.reason) {
            case "INVALID_MOVE":
                res.status(400).json(err);
                return;
            case "OTHER_PLAYER_TURN":
            case "NOT_PARTICIPANT":
                res.status(403).json(err);
                return;
            case "USER_NOT_FOUND":
                res.status(404).json(err);
                return;
            default:
                res.status(500).send(err);
                return;
        }
    } else {
        res.status(500).send();
    }
}