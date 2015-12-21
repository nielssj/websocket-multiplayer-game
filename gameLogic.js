"use strict";

class GameLogic {
    constructor() {
        this.state = {
            points: 0,
            numTilesTurned: 1,
            turnedId: 0,
            pending: false,
            tiles: [
                {name: "green", turned: true, complete: false},
                {turned: false, complete: false},
                {turned: false, complete: false},
                {turned: false, complete: false}
            ]
        };
        this.answer = [
            {name: "green"},
            {name: "red"},
            {name: "green"},
            {name: "red"}
        ];
    }

    getState() {
        return this.state;
    }

    _updateTurnTile(tileId) {
        this.state.tiles[tileId] = {
            name: this.answer[tileId].name,
            turned: true,
            complete: false
        };
        this.state.numTilesTurned++;
    }

    _updateResetTiles() {
        let tiles = this.state.tiles;
        tiles.forEach(function(tile, id) {
            if(tile.turned && !tile.complete) {
                this.state.tiles[id] = {
                    turned: false,
                    complete: false
                };
            }
        }.bind(this));
        this.state.numTilesTurned = 0;
        this.state.turnedId = -1;
    }

    _updateCompleteTiles(tile1, tile2) {
        this.state.tiles[tile1].complete = true;
        this.state.tiles[tile2].complete = true;
        this.state.points++;
    }

    turnTile(tileId) {
        return new Promise(function(resolve, reject) {
            // If no pending move
            if(!this.state.pending) {
                // If no tiles already turned, turn a tile
                if(this.state.numTilesTurned == 0) {
                    this._updateTurnTile(tileId);
                    this.state.turnedId = tileId;
                    resolve(this.state);
                    // Otherwise, depends on whether we have a match with existing turned tile
                } else {
                    // Turn new tile
                    this._updateTurnTile(tileId);
                    resolve(this.state);
                    // If matching existing turned tile, complete tiles and reset
                    if(this.answer[tileId].name === this.answer[this.state.turnedId].name) {
                        this._updateCompleteTiles(tileId, this.state.turnedId);
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