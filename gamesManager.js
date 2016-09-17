let _ = require("lodash");
let GameLogic = require("./gameLogic.js");
let url = require("url");

class GamesManager {
    constructor(users, io, games) {
        this.users = users;
        this.io = io;
        this.games = games;

        // Initiate Socket.io middleware to create game-specific namespaces upon request
        io.use(this._createSocketNamespaceIfGameExists.bind(this))
    }

    createNewGame(playerId) {
        // Create game logic object
        let game = new GameLogic(8);

            // Retrieve player object of creating player
        return this.users.findOne({ id:playerId })
            // Join creating player to game
            .then(player => game.join(player))
            // Persist game state
            .then(() => {
                return this.games.createGame(game)
            })
    }

    fetchGame(gameId) {
        return this.games.loadGame(gameId);
    }

    makeMove(gameId, playerId, move) {
        return this.games.loadGame(gameId)
            .then(game => {
                switch(move.type) {
                    case "TURN_TILE":
                        return game.turnTile(move.tileId, playerId);
                    default:
                        throw { reason:"INVALID_MOVE" }
                }
            })
            .then(game => {
                return this.games.saveGame(game)
                    .then(game => {
                        // Schedule extra persist after reset delay, if needed
                        game.scheduleResetIfNeeded()
                            .then(game => {
                                if(game) {
                                    this.games.saveGame(game)
                                }
                            });
                        return game;
                    });
            });
    }

    joinGame(gameId, playerId) {
        return Promise.all([
            this.users.findOne({ id:playerId }),
            this.games.loadGame(gameId)
        ])
            .then(res => {
                let player = res[0];
                let game = res[1];
                return game.join(player);
            })
            .then(game => this.games.saveGame(game));
    }

    _createSocketNamespaceIfGameExists(socket, next) {
        let gameId = url.parse(socket.handshake.url, true).query.ns;
        this.games.loadGame(gameId)
            .then(game => {
                if(!_.has(this.io.nsps, "/" + gameId)) {
                    let nsp = this.io.of("/" + gameId);
                    nsp.on('connection', socket => {
                        this.games.streamGameChanges(gameId, function(err, game) {
                            if(!err) {
                                socket.emit("changed", game.getPublicState())
                            } else {
                                throw err;
                            }
                        }, function(err, stream) {
                            socket.on("disconnect", function() {
                                stream.close();
                            })
                        });
                    });
                }
                next();
            })
            .catch(err => next(err));
    }
}

module.exports = GamesManager;