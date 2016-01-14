"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var nodehttp = require('http');
var socketio = require("socket.io");
var r = require("rethinkdb");

var UserRepository = require("./userRepository");
var authentication = require("./authentication");
var GamesManager = require("./gamesManager");

var userBase = new UserRepository();

var app = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended:true }))
    .use(cors());

authentication(app, userBase);

var http = nodehttp.Server(app);
var io = socketio(http);

var gamesManager;

app.post('/memory/game', function(req, res) {
    console.log("New game initiated");
    let playerId = req.user.id;
    gamesManager.createNewGame(playerId)
        .then(game => res.json(game.getState()))
        .catch(err => errorHandling(res, err));
});

app.get('/memory/game/:id', function(req, res) {
    console.log("Game state requested");
    let gameId = req.params.id;
    gamesManager.fetchGame(gameId)
        .then(game => res.json(game.getState()))
        .catch(err => errorHandling(res, err));
});

app.post('/memory/game/:id/move', function(req, res) {
    let gameId = req.params.id;
    let playerId = req.user.id;
    let move = req.body;
    gamesManager.makeMove(gameId, playerId, move)
        .then(() => res.end())
        .catch(err => errorHandling(res, err));
});

app.post('/memory/game/:id/player', function(req, res) {
    let gameId = req.params.id;
    let playerId = req.user.id;
    gamesManager.joinGame(gameId, playerId)
        .then(game => res.json(game.getState()))
        .catch(err => errorHandling(res, err));
});

app.get('/memory/player', function(req, res) {
    let playerId = req.user.id;
    userBase.findOne({id:playerId}, function(err, user) {
        if(!err && user) {
            res.json(user);
        } else if (!err) {
            errorHandling(res, {reason: "USER_NOT_FOUND"})
        }
        else {
            errorHandling(res, err);
        }
    })
});

// Conncet to database
r.connect({ host:"172.17.0.2", port:28015 })
    .then(conn => {
        // Initialize GamesManager
        gamesManager = new GamesManager(userBase, io, conn);
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