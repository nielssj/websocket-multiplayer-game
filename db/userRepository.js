const r = require("rethinkdb");
const _ = require("lodash");

class UserRepository {
    constructor(conn) {
        this.conn = conn;

        this.users = {
            john: {
                id: "36ecb365-bc76-41f7-b8ba-8ccd1d4993cc",
                username: "john"
            },
            niels: {
                id: "acbcdff3-ca47-4d6c-8df5-f9002de449a9",
                username: "niels"
            }
        };
        this.passwords = {
            "36ecb365-bc76-41f7-b8ba-8ccd1d4993cc": "1234",
            "acbcdff3-ca47-4d6c-8df5-f9002de449a9": "1234"
        };
    }

    createUser(user) {
      return r.table('users')
        .insert({ username: user.username, password: user.password}, {returnChanges: true})
        .run(this.conn)
        .then(result => {
          return result.changes[0].new_val
        })
    }

    findOne(query) {
        if(query.id) {
            return r.table("users")
                .get(query.id)
                .run(this.conn)
                .catch(error => {
                    if(error.name === "ReqlNonExistenceError") {
                        throw { reason:"USER_NOT_FOUND" }
                    }
                    throw error
                })
        }
        if(query.username) {
            return r.table("users")
                .getAll(query.username, {index: "username"})
                .nth(0)
                .run(this.conn)
                .catch(error => {
                    if(error.name === "ReqlNonExistenceError") {
                        throw { reason:"USER_NOT_FOUND" }
                    }
                    throw error
                })
        }
    }

    exists(username) {
      return this.findOne({ username: username })
        .then(existingUser => {
          return true;
        })
        .catch(err => {
          if(err.reason == "USER_NOT_FOUND") {
            return false;
          }
          throw err
        })
    }

    verifyPassword(username, password) {
        return r.table("users")
            .filter({ username:username, password:password })
            .without("password")
            .nth(0)
            .run(this.conn)
            .catch(error => {
                if(error.name === "ReqlNonExistenceError") {
                    throw { reason:"INVALID_CREDENTIALS" }
                }
                throw error
            });
    }

}

module.exports = UserRepository;