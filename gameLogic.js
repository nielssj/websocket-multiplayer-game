"use strict";

var util = require("util");
var nodeUUID = require('node-uuid');
var _ = require('lodash');

var COLORS = ["#00FF4C", "#E8D50C", "#FF5E00", "#DB0CE8", "#0D60FF", "#ACFF54", "#E8B040", "#FF5654", "#8056E8", "#47F9FF" ];

class GameLogic {
    constructor(size, id, instance) {
        if(!instance) {
            // Initialize default game state
            this.numTilesTurned = 0;
            this.turnedId = 0;
            this.state = {
                pending: false,
                tiles: [],
                players: {},
                turnPlayer: null
            };
            this.answer = [];

            // Populate tiles and answers
            for (let i = 0; i < size; i++) {
                this.state.tiles.push(
                    { turned: false, completed: false },
                    { turned: false, completed: false }
                );
                this.answer.push(
                    { name:COLORS[i] },
                    { name:COLORS[i] }
                );
            }

            // Shuffle answers (make game unique)
            this.answer = _.shuffle(this.answer);
        } else {
            _.assign(this, instance);
        }
    }

    getPublicState() {
        return _.assign({id:this.id}, this.state)
    }

    getFullState() {
        return _.pick(this, ["answer", "state", "numTilesTurned", "turnedId"]);
    }

    _updateTurnTile(tileId) {
        this.state.tiles[tileId] = {
            name: this.answer[tileId].name,
            turned: true,
            completed: false
        };
        this.numTilesTurned++;
    }

    _updateResetTiles() {
        let tiles = this.state.tiles;
        tiles.forEach(function(tile, id) {
            if(tile.turned && !tile.completed) {
                this.state.tiles[id] = {
                    turned: false,
                    completed: false
                };
            }
        }.bind(this));
        this.numTilesTurned = 0;
        this.turnedId = -1;
    }

    _updateCompleteTiles(tile1, tile2, playerId) {
        this.state.tiles[tile1].completed = true;
        this.state.tiles[tile2].completed = true;
        this.state.players[playerId].points++;
    }

    _isParticipant(playerId) {
        return _.has(this.state.players, playerId);
    }

    _nextTurn() {
        let curPlayerId = this.state.turnPlayer;
        let playerIds = Object.keys(this.state.players);
        let currentNum = _.indexOf(playerIds, curPlayerId);
        var newPlayerId;
        if(currentNum + 1 < playerIds.length) {
            newPlayerId = playerIds[currentNum + 1];
        } else {
            newPlayerId = playerIds[0];
        }
        this.state.turnPlayer = newPlayerId;
        this.state.players[curPlayerId].hasTurn = false;
        this.state.players[newPlayerId].hasTurn = true;
    }

    turnTile(tileId, playerId) {
        return new Promise(function(resolve, reject) {
            if(!this._isParticipant(playerId)) {
                reject({ reason: "NOT_PARTICIPANT"});
                return;
            }

            if(this.state.turnPlayer !== playerId) {
                reject({ reason: "OTHER_PLAYER_TURN"});
                return;
            }

            // If no pending move
            if(!this.state.pending) {
                // If no tiles already turned, turn a tile
                if(this.numTilesTurned == 0) {
                    this._updateTurnTile(tileId);
                    this.turnedId = tileId;
                    resolve(this);
                    // Otherwise, depends on whether we have a match with existing turned tile
                } else {
                    // Turn new tile
                    this._updateTurnTile(tileId);
                    // If matching existing turned tile, complete tiles and reset
                    if(this.answer[tileId].name === this.answer[this.turnedId].name) {
                        this._updateCompleteTiles(tileId, this.turnedId, playerId);
                        this._updateResetTiles();
                        this._nextTurn();
                    // Otherwise, give 1 second delay for memorization and then reset
                    } else {
                        this.state.pending = true;
                    }
                    resolve(this);
            }
            } else {
                reject();
            }
        }.bind(this));
    }

    scheduleResetIfNeeded() {
        return new Promise((resolve, reject) => {
            if(this.state.pending === true) {
                setTimeout(() => {
                    this.state.pending = false;
                    this._updateResetTiles();
                    this._nextTurn();
                    resolve(this);
                }, 1000);
            } else {
                resolve();
            }
        })
    }

    join(player) {
        let exPlayer = this.state.players[player.id];
        if(!exPlayer) {
            player.points = 0;
            this.state.players[player.id] = player;
            if(!this.state.turnPlayer) {
                player.hasTurn = true;
                this.state.turnPlayer = player.id;
            }
        }
        return this;
    }
}


module.exports = GameLogic;