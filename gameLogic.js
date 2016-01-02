"use strict";

var nodeUUID = require('node-uuid');

class GameLogic {
    constructor(id) {
        this.numTilesTurned = 1;
        this.turnedId = 0;
        this.state = {
            id: id ? id : nodeUUID.v4(),
            points: 0,
            pending: false,
            tiles: [
                {name: "green", turned: true, completed: false},
                {turned: false, completed: false},
                {turned: false, completed: false},
                {turned: false, completed: false}
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