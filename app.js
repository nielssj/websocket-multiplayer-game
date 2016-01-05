"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var nodehttp = require('http');
var socketio = require("socket.io");
var GameLogic = require("./gameLogic.js");
var UserRepository = require("./userRepository");
var authentication = require("./authentication");

var User = new UserRepository();

var app = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended:true }))
    .use(cors());

authentication(app, User);

var http = nodehttp.Server(app);
var io = socketio(http);

var games = {};
var ioNamespaces = {};
var defaultId = "aa051eca-0dbb-4911-8351-f6deb9ad3b45";
games[defaultId] = new GameLogic(8, User, defaultId);

app.post('/memory/game', function(req, res) {
    console.log("New game initiated");

    // Create game
    let game = new GameLogic(8, User);
    let gameId = game.state.id;
    games[gameId] = game;
    game.events.on("changed", msg => console.log("Game state changed [" + msg.id + "]"));

    // Create new socket.io namespace
    var nsp = io.of('/' + gameId);
    nsp.on('connection', socket => {
        // Listen for and emit all game state changes
        let cb = function(state) {
            socket.emit("changed", state)
        };
        game.events.on("changed", cb);
        // Stop listening, if disconnect
        socket.on("disconnect", function() {
            game.events.removeListener("changed", cb);
        })
    });
    ioNamespaces[gameId] = nsp;

    // Creator must join game
    game.join(req.user.id)
        .then(game => {
            res.json(game.getState())
        })
        .catch(err => res.status(500).send(err));
});

app.get('/memory/game/:id', function(req, res) {
    console.log("Game state requested");

    let game = games[req.params.id];
    res.send(game.getState());
});

app.post('/memory/game/:id/move', function(req, res) {
    var move = req.body;
    let game = games[req.params.id];
    var promise = null;

    switch(move.type) {
        case "TURN_TILE":
            promise = game.turnTile(move.tileId, req.user.id);
            break;
    }

    if(promise) {
        promise
            .then(() => res.end())
            .catch((err) => res.status(500).send(err))
    } else {
        res.status(400).send("Invalid move type");
    }
});

app.post('/memory/game/:id/player', function(req, res) {
    let game = games[req.params.id];

    game.join(req.user.id)
        .then(game => res.json(game.getState()))
        .catch(err => res.status(500).send(err));
});

http.listen(3000, function() {
    var port = http.address().port;
    console.log("Example app listening at http://localhost:%s", port);
});