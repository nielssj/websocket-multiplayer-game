"use strict";

var expressJWT = require("express-jwt");
var jwt = require("jsonwebtoken");

let JWT_SECRET = "secret"; // TODO: Move secret to separate configuration

var Authentication = function(app, User) {

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
        User.findOne({username: req.body.username}, function(err, user) {
            if(user) {
                if(User.verifyPassword(user, req.body.password)) {
                    let token = jwt.sign({ id:user.id }, JWT_SECRET);
                    res.status(200).json(token);
                } else {
                    res.status(401).json({ reason: "INVALID_CREDENTIALS"});
                }
            } else {
                res.status(401).json({ reason: "INVALID_CREDENTIALS"});
            }
        })
    });
}

module.exports = Authentication;