"use strict";

var nodeUUID = require('node-uuid');
var _ = require('lodash');

var COLORS = ["#00FF4C", "#E8D50C", "#FF5E00", "#DB0CE8", "#0D60FF", "#ACFF54", "#E8B040", "#FF5654", "#8056E8", "#47F9FF" ];

class GameLogic {
    constructor(size, id) {
        // Initialize default game state
        this.numTilesTurned = 0;
        this.turnedId = 0;
        this.state = {
            id: id ? id : nodeUUID.v4(),
            points: 0,
            pending: false,
            tiles: []
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
    }

    getState() {
        return this.state;
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

    _updateCompleteTiles(tile1, tile2) {
        this.state.tiles[tile1].completed = true;
        this.state.tiles[tile2].completed = true;
        this.state.points++;
    }

    turnTile(tileId) {
        return new Promise(function(resolve, reject) {
            // If no pending move
            if(!this.state.pending) {
                // If no tiles already turned, turn a tile
                if(this.numTilesTurned == 0) {
                    this._updateTurnTile(tileId);
                    this.turnedId = tileId;
                    resolve(this.state);
                    // Otherwise, depends on whether we have a match with existing turned tile
                } else {
                    // Turn new tile
                    this._updateTurnTile(tileId);
                    resolve(this.state);
                    // If matching existing turned tile, complete tiles and reset
                    if(this.answer[tileId].name === this.answer[this.turnedId].name) {
                        this._updateCompleteTiles(tileId, this.turnedId);
                        this._updateResetTiles();
                    // Otherwise, give 1 second delay for memorization and then reset
                    } else {
                        this.state.pending = true;
                        setTimeout(() => {
                            this._updateResetTiles();
                            this.state.pending = false;
                        }, 1000);
                }
            }
            } else {
                reject();
            }
        }.bind(this));
    }
}


module.exports = GameLogic;