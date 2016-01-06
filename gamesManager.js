"use strict";

var GameLogic = require("./gameLogic.js");

class GamesManager {
    constructor(userBase, io) {
        this.userBase = userBase;
        this.io = io;

        this.games = {};
        this.ioNamespaces = {};

        var defaultId = "aa051eca-0dbb-4911-8351-f6deb9ad3b45";
        this.games[defaultId] = new GameLogic(8, userBase, defaultId);
    }

    createNewGame(playerId) {
        // Create game logic object
        let game = new GameLogic(8, this.userBase);
        let gameId = game.state.id;
        this.games[gameId] = game;

        // Subscribe logging to state changes of game
        game.events.on("changed", msg => console.log("Game state changed [" + msg.id + "]"));

        // Create new socket.io namespace
        var nsp = this.io.of('/' + gameId);
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
        this.ioNamespaces[gameId] = nsp;

        // Finally, creator must join game
        return game.join(playerId);
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
        return game.join(playerId);
    }
}

module.exports = GamesManager;