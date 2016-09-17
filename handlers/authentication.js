const expressJWT = require("express-jwt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "secret"; // TODO: Move secret to separate configuration

var Authentication = function(app, users) {

    app.use(expressJWT({ secret:JWT_SECRET })
        .unless({ path: [
            "/login",
            { url:/^(\/memory\/game\/?[^\/]*)$/, methods:["GET"] }
        ]}));

    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            return next({ reason: "UNAUTHORIZED_REQUEST"});
        }
        next(err);
    });

    app.post("/login", function(req, res, next) {
        users.verifyPassword(req.body.username, req.body.password)
            .then(user => {
                let token = jwt.sign({ id:user.id }, JWT_SECRET);
                res.status(200).json(token);
            })
            .catch(next);
    });
}

module.exports = Authentication;