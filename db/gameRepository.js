"use strict";

var r = require("rethinkdb");
var GameLogic = require("../gameLogic.js");

class GameRepository {
    constructor(conn) {
        this.conn = conn;
    }

    createGame(game) {
        return r.table("games")
            .insert(game.getFullState())
            .run(this.conn)
            .then((result) => {
                let gameId = result.generated_keys[0];
                game.id = gameId;
                return game;
            });
    }

    loadGame(gameId) {
        return r.table("games")
            .get(gameId).run(this.conn)
            .then(result => {
                if(result) {
                    let game = new GameLogic(0, null, result);
                    return game;
                } else {
                    throw { reason:"GAME_NOT_FOUND" }
                }
            })
    }

    saveGame(game) {
        return r.table("games")
            .get(game.id)
            .update(game.getFullState())
            .run(this.conn)
            .then(result => game)
    }

    streamGameChanges(gameId, onChange, onConnect) {
        return r.table("games").get(gameId).changes()
            .run(this.conn, function(err, cursor) {
                onConnect(err, cursor);
                // Emit all changes to socket
                cursor.each(function(err, change) {
                    if(!err) {
                        let game = new GameLogic(0, null, change.new_val);
                        onChange(null, game)
                    } else {
                        onChange(err);
                    }
                });
            });
    }
}

module.exports = GameRepository;