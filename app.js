"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var GameLogic = require("./gameLogic.js");

var app = express()
    .use(bodyParser.json())
    .use(cors());

var games = {};
var defaultId = "aa051eca-0dbb-4911-8351-f6deb9ad3b45";
games[defaultId] = new GameLogic(defaultId);

app.post('/memory/game', function(req, res) {
    console.log("New game initiated");

    let game = new GameLogic();
    games[game.state.id] = game;

    res.send(game.getState());
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

    console.log("Move made: " + req.body);

    switch(move.type) {
        case "TURN_TILE":
            promise = game.turnTile(move.tileId);
            break;
    }

    if(promise) {
        promise
            .then((result) => res.send(result))
            .catch((err) => res.status(500).send(err))
    } else {
        res.status(400).send("Invalid move type");
    }
});

var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});