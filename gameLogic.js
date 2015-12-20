"use strict";

class GameLogic {
    constructor() {
        this.numTilesTurned = 1;
        this.turnedId = 0;
        this.pending = false;
        this.tiles = [
            { name: "green", turned: true, complete: false },
            { turned: false, complete: false },
            { turned: false, complete: false },
            { turned: false, complete: false }
        ];
        this.answer = [
            { name: "green" },
            { name: "red"},
            { name: "green"},
            { name: "red"}
        ];
    }

    getState() {
        return {
            turnedId: this.turnedId,
            pending: this.pending,
            tiles: this.tiles
        }
    }

    _updateTurnTile(tileId) {
        this.tiles[tileId] = {
            name: this.answer[tileId].name,
            turned: true,
            complete: false
        };
        this.numTilesTurned++;
    }

    _updateResetTiles() {
        let tiles = this.tiles;
        tiles.forEach(function(tile, id) {
            if(tile.turned && !tile.complete) {
                this.tiles[id] = {
                    turned: false,
                    complete: false
                };
            }
        }.bind(this));
        this.numTilesTurned = 0;
        this.turnedId = -1;
    }

    _updateCompleteTiles(tile1, tile2) {
        this.tiles[tile1].complete = true;
        this.tiles[tile2].complete = true;
        console.log("Points!");
    }

    turnTile(tileId) {
        return new Promise(function(resolve, reject) {
            // If no pending move
            if(!this.pending) {
                // If no tiles already turned, turn a tile
                if(this.numTilesTurned == 0) {
                    this._updateTurnTile(tileId);
                    this.turnedId = tileId;
                    resolve(this.tiles);
                    // Otherwise, depends on whether we have a match with existing turned tile
                } else {
                    // Turn new tile
                    this._updateTurnTile(tileId);
                    resolve(this.tiles);
                    // If matching existing turned tile, complete tiles and reset
                    if(this.answer[tileId].name === this.answer[this.turnedId].name) {
                        this._updateCompleteTiles(tileId, this.turnedId);
                        this._updateResetTiles();
                        //resolve(this.tiles);
                    // Otherwise, give 1 second delay for memorization and then reset
                    } else {
                        this.pending = true;
                        setTimeout(() => {
                            this._updateResetTiles();
                            this.pending = false;
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