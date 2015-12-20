var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var GameLogic = require("./gameLogic.js");

var app = express()
    .use(bodyParser.json())
    .use(cors());

var logic = new GameLogic();

app.get('/memory/game/:id', function(req, res) {
    console.log("Game state requested");

    res.send(logic.getState());
});

app.post('/memory/game/move', function(req, res) {
    var move = req.body;
    var promise = null;

    console.log("Move made: " + req.body);

    switch(move.type) {
        case "TURN_TILE":
            promise = logic.turnTile(move.tileId);
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