"use strict";

var expressJWT = require("express-jwt");
var jwt = require("jsonwebtoken");

let JWT_SECRET = "secret"; // TODO: Move secret to separate configuration

var Authentication = function(app, users) {

    app.use(expressJWT({ secret:JWT_SECRET })
        .unless({ path: [
            "/login",
            { url:/^(\/memory\/game\/?[^\/]*)$/, methods:["GET"] }
        ]}));

    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            res.status(401).json({ reason: "UNAUTHORIZED_REQUEST"})
        }
    });

    app.post("/login", function(req, res) {
        users.verifyPassword(req.body.username, req.body.password)
            .then(user => {
                let token = jwt.sign({ id:user.id }, JWT_SECRET);
                res.status(200).json(token);
            })
            .catch(error => {
                if(error.reason === "INVALID_CREDENTIALS") {
                    res.status(401).json(error);
                }
            });
    });
}

module.exports = Authentication;