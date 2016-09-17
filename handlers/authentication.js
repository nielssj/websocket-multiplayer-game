const expressJWT = require("express-jwt");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = "secret"; // TODO: Move secret to separate configuration

var Authentication = function(app, users) {

    app.use(expressJWT({ secret:JWT_SECRET })
        .unless({ path: [
            "/login",
            { url: "/user", methods: ["POST"] },
            { url:/^(\/memory\/game\/?[^\/]*)$/, methods:["GET"] }
        ]}));

    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            return next({ reason: "UNAUTHORIZED_REQUEST"});
        }
        next(err);
    });

    app.post('/user', function(req, res, next) {
        users.exists(req.body.username)
          .then(exists => {
            if (exists) {
              throw { reason: "USER_ALREADY_EXISTS" }
            }
          })
          .then(() => {
            let password = String(req.body.password)
            return new Promise((resolve, reject) => {
              bcrypt.hash(password, 10, (err, hash) => {
                if(err) {
                  return reject(err)
                }
                resolve(hash)
              })
            })
          })
          .then(hash => {
            const user = {
              username: req.body.username,
              password: hash
            }
            return users.createUser(user)
          })
          .then(newUser => {
            res.status(200).send(newUser)
          })
          .catch(next)
    });

    app.post("/login", function(req, res, next) {
      let user = null;
        users.findOne({username: req.body.username})
          .then(result => {
            user = result;
            return new Promise((resolve, reject) => {
              let password = String(req.body.password)
              bcrypt.compare(password, user.password, (err, isMatch) => {
                if(err) {
                  return reject(err)
                }
                resolve(isMatch)
              })
            })
          })
          .then(isMatch => {
            if(isMatch) {
              let token = jwt.sign({ id:user.id }, JWT_SECRET);
              res.status(200).json(token);
            } else {
              throw { reason: 'INVALID_CREDENTIALS' }
            }
          })
          .catch(err => {
            if(err.reason == "USER_NOT_FOUND") {
              throw { reason: 'INVALID_CREDENTIALS' }
            }
            throw err
          })
          .catch(next)
    });
}

module.exports = Authentication;