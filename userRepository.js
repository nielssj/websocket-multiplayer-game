"use strict";

var _ = require("lodash");

class UserRepository {
    constructor() {
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

    findOne(query, cb) {
        try {
            let user = null;
            if(query.username) {
                user = this.users[query.username];
            } else if(query.id) {
                user = _.find(this.users, u => u.id === query.id);
            }

            if(user) {
                cb(null, user);
            } else {
                cb();
            }
        } catch (err) {
            console.error("Failed to find user: " + err);
            cb(err);
        }
    }

    verifyPassword(user, password) {
        try {
            let truePassword = this.passwords[user.id];
            if(truePassword) {
                return truePassword === password;
            } else {
                return false;
            }
        } catch (err) {
            console.error("Failed to verify password: " + err);
            return false;
        }
    }

}

module.exports = UserRepository;