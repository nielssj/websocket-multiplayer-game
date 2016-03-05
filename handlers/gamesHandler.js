"use strict";

var MemoryHandler = function(app, gamesManager) {
    app.post('/memory/game', function(req, res) {
        console.log("New game initiated");
        let playerId = req.user.id;
        gamesManager.createNewGame(playerId)
            .then(game => res.json(game.getPublicState()))
            .catch(err => errorHandling(res, err));
    });

    app.get('/memory/game/:id', function(req, res) {
        console.log("Game state requested");
        let gameId = req.params.id;
        gamesManager.fetchGame(gameId)
            .then(game => res.json(game.getPublicState()))
            .catch(err => errorHandling(res, err));
    });

    app.post('/memory/game/:id/move', function(req, res) {
        let gameId = req.params.id;
        let playerId = req.user.id;
        let move = req.body;
        gamesManager.makeMove(gameId, playerId, move)
            .then(() => res.end())
            .catch(err => errorHandling(res, err));
    });

    app.post('/memory/game/:id/player', function(req, res) {
        let gameId = req.params.id;
        let playerId = req.user.id;
        gamesManager.joinGame(gameId, playerId)
            .then(game => res.json(game.getPublicState()))
            .catch(err => errorHandling(res, err));
    });
}

module.exports = MemoryHandler;
