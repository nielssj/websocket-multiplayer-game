const MemoryHandler = function(app, gamesManager) {
    app.post('/memory/game', function(req, res, next) {
        console.log("New game initiated");
        let playerId = req.user.id;
        gamesManager.createNewGame(playerId)
            .then(game => res.json(game.getPublicState()))
            .catch(next);
    });

    app.get('/memory/game/:id', function(req, res, next) {
        console.log("Game state requested");
        let gameId = req.params.id;
        gamesManager.fetchGame(gameId)
            .then(game => res.json(game.getPublicState()))
            .catch(next);
    });

    app.post('/memory/game/:id/move', function(req, res, next) {
        let gameId = req.params.id;
        let playerId = req.user.id;
        let move = req.body;
        gamesManager.makeMove(gameId, playerId, move)
            .then(() => res.end())
            .catch(next);
    });

    app.post('/memory/game/:id/player', function(req, res, next) {
        let gameId = req.params.id;
        let playerId = req.user.id;
        gamesManager.joinGame(gameId, playerId)
            .then(game => res.json(game.getPublicState()))
            .catch(next);
    });
}

module.exports = MemoryHandler;
