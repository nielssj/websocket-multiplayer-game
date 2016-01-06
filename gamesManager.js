"use strict";

var GameLogic = require("./gameLogic.js");
var url = require("url");
var _ = require("lodash");

class GamesManager {
    constructor(userBase, io) {
        this.userBase = userBase;
        this.io = io;

        this.games = {};

        var defaultId = "aa051eca-0dbb-4911-8351-f6deb9ad3b45";
        this.games[defaultId] = new GameLogic(8, defaultId);

        // Initiate Socket.io middleware to create game-specific namespaces upon request
        io.use(this._createSocketNamespaceIfGameExists.bind(this))
    }

    createNewGame(playerId) {
        // Create game logic object
        let game = new GameLogic(8);
        let gameId = game.state.id;
        this.games[gameId] = game;

        // Subscribe logging to state changes of game
        game.events.on("changed", msg => console.log("Game state changed [" + msg.id + "]"));

        // Finally, creating player must be retrieved and join game
        return this._retrievePlayer(playerId)
            .then(player => game.join(player));
    }

    fetchGame(gameId) {
        return new Promise((resolve, reject) => {
           resolve(this.games[gameId])
        });
    }

    makeMove(gameId, playerId, move) {
        let game = this.games[gameId];
        var promise = null;

        switch(move.type) {
            case "TURN_TILE":
                promise = game.turnTile(move.tileId, playerId);
                break;
        }

        if(promise) {
            return promise
        } else {
            return new Promise((resolve, reject) =>
                reject({ reason: "INVALID_MOVE"})
            );
        }
    }

    joinGame(gameId, playerId) {
        let game = this.games[gameId];
        return this._retrievePlayer(playerId)
            .then(player => game.join(player));
    }

    _retrievePlayer(playerId) {
        return new Promise(function (resolve, reject) {
            this.userBase.findOne({ id:playerId }, function (err, player) {
                if(!err) {
                    resolve(player)
                } else {
                    reject(err);
                }
            })
        }.bind(this))
    }

    _createSocketNamespaceIfGameExists(socket, next) {
        let ns = url.parse(socket.handshake.url, true).query.ns;
        if(_.has(this.games, ns)) {
            if(!_.has(this.io.nsps, "/" + ns)) {
                let nsp = this.io.of("/" + ns);
                let game = this.games[ns];
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
            }
            next();
        } else {
            next({ reason:"NO_SUCH_GAME"})
        }
    }
}

module.exports = GamesManager;