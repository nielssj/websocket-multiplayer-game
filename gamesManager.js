"use strict";

var r = require("rethinkdb");
var _ = require("lodash");
var GameLogic = require("./gameLogic.js");
var url = require("url");

class GamesManager {
    constructor(userBase, io, dbConn) {
        this.userBase = userBase;
        this.io = io;
        this.dbConn = dbConn;

        this.games = {};

        var defaultId = "aa051eca-0dbb-4911-8351-f6deb9ad3b45";
        this.games[defaultId] = new GameLogic(8, defaultId);

        // Initiate Socket.io middleware to create game-specific namespaces upon request
        io.use(this._createSocketNamespaceIfGameExists.bind(this))
    }

    createNewGame(playerId) {
        // Create game logic object
        let game = new GameLogic(8);

            // Retrieve player object of creating player
        return this._retrievePlayer(playerId)
            // Join creating player to game
            .then(player => game.join(player))
            // Persist game state
            .then(() => {
                return r.table("games")
                    .insert(_.pick(game, ["answer", "state", "numTilesTurned", "turnedId"]))
                    .run(this.dbConn);
            })
            // Return game state
            .then((result) => {
                let gameId = result.generated_keys[0];
                game.id = gameId;
                return game;
            });
    }

    fetchGame(gameId) {
        return r.table("games")
            .get(gameId).run(this.dbConn)
            .then(game => new GameLogic(0, null, game));
    }

    makeMove(gameId, playerId, move) {
        return r.table("games").get(gameId).run(this.dbConn)
            .then(result => {
                if(result) {
                    let game = new GameLogic(0, null, result);
                    switch(move.type) {
                        case "TURN_TILE":
                            return game.turnTile(move.tileId, playerId);
                        default:
                            throw { reason:"INVALID_MOVE" }
                    }
                } else {
                    throw { reason:"GAME_NOT_FOUND" }
                }
            })
            .then(game => {
                var persistGame = (game) => {
                    return r.table("games")
                        .get(game.id)
                        .update(_.pick(game, ["answer", "state", "numTilesTurned", "turnedId"]))
                        .run(this.dbConn)
                        .then(result => game)
                };
                return persistGame(game)
                    .then(() => {
                        // Schedule extra persist after reset delay, if needed
                        game.scheduleResetIfNeeded()
                            .then(game => {
                                if(game) {
                                    persistGame(game)
                                }
                            });
                        return game;
                    });
            });
    }

    joinGame(gameId, playerId) {
        return this._retrievePlayer(playerId)
            .then(player =>
                r.table("games").get(gameId).run(this.dbConn)
                    .then(game => {
                        return {
                            player:player,
                            game: new GameLogic(0, null, game)
                        }
                    })
            )
            .then(res => {
                return res.game.join(res.player)
            })
            .then(game => r.table("games")
                .get(game.id)
                .update(_.pick(game, ["answer", "state", "numTilesTurned", "turnedId"]))
                .run(this.dbConn)
                .then(result => game)
            );
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
        r.table("games").get(ns).run(this.dbConn)
            .then(result => {
                if(result) {
                    if(!_.has(this.io.nsps, "/" + ns)) {
                        let nsp = this.io.of("/" + ns);
                        nsp.on('connection', socket => {
                            r.table("games").get(ns).changes()
                                .run(this.dbConn, function(err, cursor) {
                                    // Emit all changes to socket
                                    cursor.each(function(err, change) {
                                        if(!err) {
                                            let game = new GameLogic(0, null, change.new_val);
                                            socket.emit("changed", game.getPublicState())
                                        }
                                    });
                                    // Stop listening, if disconnect
                                    socket.on("disconnect", function() {
                                        cursor.close();
                                    })
                                });
                        });
                    }
                   next();
                } else {
                   next({ reason:"NO_SUCH_GAME"})
                }
            });
    }
}

module.exports = GamesManager;