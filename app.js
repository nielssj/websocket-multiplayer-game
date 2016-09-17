const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodehttp = require('http');
const socketio = require("socket.io");
const r = require("rethinkdb");

const UserRepository = require("./db/userRepository");
const GameRepository = require("./db/gameRepository");

const GamesManager = require("./gamesManager");

const authentication = require("./handlers/authentication");
const memoryHandler = require("./handlers/gamesHandler");

const app = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended:true }))
    .use(cors());

const http = nodehttp.Server(app);
const io = socketio(http);

let users;
let games;
let gamesManager;

app.get('/memory/player', function(req, res, next) {
    let playerId = req.user.id;
    users.findOne({id:playerId})
        .then(res.json)
        .catch(next);
});

// Conncet to database
r.connect({ host:"localhost", port:28015 })
    .then(conn => {
        // Initialize repositories
        games = new GameRepository(conn);
        users = new UserRepository(conn);
        // Initialize GamesManager
        gamesManager = new GamesManager(users, io, games);
        // Initialize handlers
        authentication(app, users);
        memoryHandler(app, gamesManager);
        // Attach error handler
        app.use(errorHandling);
        // Start listening for requests
        http.listen(3000, function() {
            const port = http.address().port;
            console.log("Example app listening at http://localhost:%s", port);
        });
    })
    .catch(err => console.log("Failed to start server: " + err));

function errorHandling(err, req, res, next) {
    if(err) {
        switch (err.reason) {
            case "INVALID_CREDENTIALS":
            case "UNAUTHORIZED_REQUEST":
                res.status(401).json(err);
                return;
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
            case "USER_ALREADY_EXISTS":
                res.status(400).json(err)
          default:
                console.error(err.stack);
                res.status(500).json(err.stack); // FIXME: Hide in production
                return;
        }
    } else {
        res.status(500).send();
    }
}

module.exports = http